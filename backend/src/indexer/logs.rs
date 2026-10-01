use anyhow::{Context, Result};
use serde_json::{Value, json};

use crate::{
    indexer::erc20::{format_amount, get_token_metadata, hex_to_decimal},
    labels::resolver::resolve_address,
    models::{
        fund_flow::{FundFlow, FundFlowEdge, FundFlowNode},
        token::TokenTransfer,
    },
    rpc::RpcClient,
};

const ERC20_TRANSFER_TOPIC: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

pub async fn index_logs(rpc: &RpcClient, tx_hash: &str) -> Result<Vec<TokenTransfer>> {
    let receipt = rpc
        .call("eth_getTransactionReceipt", json!([tx_hash]))
        .await?;

    if receipt.is_null() {
        anyhow::bail!("transaction receipt not found");
    }

    let logs = receipt
        .get("logs")
        .and_then(Value::as_array)
        .context("transaction receipt logs missing")?;

    let mut transfers = Vec::new();

    for log in logs {
        let topics = match log.get("topics").and_then(Value::as_array) {
            Some(topics) => topics,
            None => continue,
        };

        if topics.len() != 3 {
            continue;
        }

        let event_signature = topics[0].as_str().unwrap_or_default().to_lowercase();

        if event_signature != ERC20_TRANSFER_TOPIC {
            continue;
        }

        let token_address = log
            .get("address")
            .and_then(Value::as_str)
            .context("ERC-20 token address missing")?
            .to_lowercase();

        let from_address =
            decode_address(topics[1].as_str().context("ERC-20 from topic missing")?)?;

        let to_address = decode_address(topics[2].as_str().context("ERC-20 to topic missing")?)?;

        let amount = log
            .get("data")
            .and_then(Value::as_str)
            .context("ERC-20 transfer amount missing")?
            .to_string();

        let log_index = log
            .get("logIndex")
            .and_then(Value::as_str)
            .map(parse_hex_u64)
            .transpose()?
            .unwrap_or(0);

        transfers.push(TokenTransfer {
            chain_id: 1,
            tx_hash: tx_hash.to_string(),
            token_address,
            from_address,
            to_address,
            amount,
            log_index,
        });
    }

    Ok(transfers)
}

pub async fn build_fund_flow(
    rpc: &RpcClient,
    tx_hash: &str,
    transfers: &[TokenTransfer],
) -> Result<FundFlow> {
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let mut metadata_cache: std::collections::HashMap<String, (String, u8)> =
        std::collections::HashMap::new();

    let transaction = rpc
        .call("eth_getTransactionByHash", json!([tx_hash]))
        .await?;

    let transaction_from = transaction
        .get("from")
        .and_then(Value::as_str)
        .context("transaction sender missing")?
        .to_string();

    let transaction_to = transaction
        .get("to")
        .and_then(Value::as_str)
        .map(str::to_string);

    let transaction_value = transaction
        .get("value")
        .and_then(Value::as_str)
        .context("transaction value missing")?;

    let transaction_value_decimal = hex_to_decimal(transaction_value)?;

    if transaction_value_decimal != "0" {
        if let Some(to_address) = &transaction_to {
            add_node(&mut nodes, &transaction_from).await?;
            add_node(&mut nodes, to_address).await?;

            edges.push(FundFlowEdge {
                from: transaction_from.clone(),
                to: to_address.clone(),
                token_address: None,
                symbol: "ETH".to_string(),
                decimals: 18,
                amount: transaction_value_decimal.clone(),
                human_amount: format_amount(&transaction_value_decimal, 18)?,
                log_index: None,
            });
        }
    }

    for transfer in transfers {
        add_node(&mut nodes, &transfer.from_address).await?;
        add_node(&mut nodes, &transfer.to_address).await?;

        let (symbol, decimals) = if let Some(metadata) = metadata_cache.get(&transfer.token_address)
        {
            metadata.clone()
        } else {
            let metadata = match get_token_metadata(rpc, &transfer.token_address).await {
                Ok(metadata) => metadata,
                Err(_) => ("UNKNOWN".to_string(), 0),
            };

            metadata_cache.insert(transfer.token_address.clone(), metadata.clone());
            metadata
        };

        let decimal_amount = hex_to_decimal(&transfer.amount)?;
        let human_amount = format_amount(&decimal_amount, decimals)?;

        edges.push(FundFlowEdge {
            from: transfer.from_address.clone(),
            to: transfer.to_address.clone(),
            token_address: Some(transfer.token_address.clone()),
            symbol,
            decimals,
            amount: decimal_amount,
            human_amount,
            log_index: Some(transfer.log_index),
        });
    }

    Ok(FundFlow {
        transaction_hash: tx_hash.to_string(),
        transaction_from: transaction_from.clone(),
        nodes,
        edges,
    })
}

async fn add_node(nodes: &mut Vec<FundFlowNode>, address: &str) -> Result<()> {
    if nodes.iter().any(|node| node.address == address) {
        return Ok(());
    }

    let label = resolve_address(address).await?.map(|value| value.label);

    nodes.push(FundFlowNode {
        address: address.to_string(),
        label,
    });

    Ok(())
}

fn decode_address(topic: &str) -> Result<String> {
    let value = topic.trim_start_matches("0x");

    if value.len() != 64 {
        anyhow::bail!("invalid indexed address topic");
    }

    Ok(format!("0x{}", &value[24..].to_lowercase()))
}

fn parse_hex_u64(value: &str) -> Result<u64> {
    u64::from_str_radix(value.trim_start_matches("0x"), 16).context("invalid hexadecimal log index")
}
