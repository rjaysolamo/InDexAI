use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;

use crate::rpc::RpcClient;

const ERC20_TRANSFER_TOPIC: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Erc20Transfer {
    pub transaction_hash: String,
    pub block_number: u64,
    pub token_address: String,
    pub symbol: String,
    pub decimals: u8,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub human_amount: String,
    pub log_index: u64,
}

pub async fn scan_transfer_logs(
    rpc: &RpcClient,
    from_block: u64,
    to_block: u64,
) -> Result<Vec<Erc20Transfer>> {
    let filter = json!({
        "fromBlock": format!("0x{:x}", from_block),
        "toBlock": format!("0x{:x}", to_block),
        "topics": [ERC20_TRANSFER_TOPIC]
    });

    let logs = rpc.get_logs(filter).await?;

    let mut transfers = Vec::new();
    let mut metadata_cache: HashMap<String, (String, u8)> = HashMap::new();

    for log in logs {
        let topics = match log.get("topics").and_then(Value::as_array) {
            Some(topics) => topics,
            None => continue,
        };

        if topics.len() != 3 {
            continue;
        }

        let token_address = match log.get("address").and_then(Value::as_str) {
            Some(address) => address.to_lowercase(),
            None => continue,
        };

        let from_address = match topics[1].as_str() {
            Some(topic) => decode_address(topic)?,
            None => continue,
        };

        let to_address = match topics[2].as_str() {
            Some(topic) => decode_address(topic)?,
            None => continue,
        };

        let amount_hex = match log.get("data").and_then(Value::as_str) {
            Some(amount) => amount,
            None => continue,
        };

        let amount = hex_to_decimal(amount_hex)?;

        let (symbol, decimals) = if let Some(metadata) = metadata_cache.get(&token_address) {
            metadata.clone()
        } else {
            let metadata = match get_token_metadata(rpc, &token_address).await {
                Ok(metadata) => metadata,
                Err(error) => {
                    eprintln!("Skipping token {}: {}", token_address, error);
                    continue;
                }
            };

            metadata_cache.insert(token_address.clone(), metadata.clone());
            metadata
        };

        let human_amount = format_amount(&amount, decimals)?;

        let transaction_hash = log
            .get("transactionHash")
            .and_then(Value::as_str)
            .context("transaction hash missing")?
            .to_string();

        let block_number = log
            .get("blockNumber")
            .and_then(Value::as_str)
            .context("block number missing")?;

        let log_index = log
            .get("logIndex")
            .and_then(Value::as_str)
            .context("log index missing")?;

        transfers.push(Erc20Transfer {
            transaction_hash,
            block_number: parse_hex_u64(block_number)?,
            token_address,
            symbol,
            decimals,
            from_address,
            to_address,
            amount,
            human_amount,
            log_index: parse_hex_u64(log_index)?,
        });
    }

    Ok(transfers)
}

pub async fn get_token_metadata(rpc: &RpcClient, token_address: &str) -> Result<(String, u8)> {
    fetch_token_metadata(rpc, token_address).await
}

async fn fetch_token_metadata(rpc: &RpcClient, token_address: &str) -> Result<(String, u8)> {
    let decimals_result = rpc
        .call(
            "eth_call",
            json!([
                {
                    "to": token_address,
                    "data": "0x313ce567"
                },
                "latest"
            ]),
        )
        .await?;

    let decimals_hex = decimals_result
        .as_str()
        .context("invalid decimals response")?;

    let decimals = parse_hex_u64(decimals_hex)?;

    let decimals = u8::try_from(decimals).context("token decimals exceed u8")?;

    let symbol_result = rpc
        .call(
            "eth_call",
            json!([
                {
                    "to": token_address,
                    "data": "0x95d89b41"
                },
                "latest"
            ]),
        )
        .await?;

    let symbol_hex = symbol_result.as_str().context("invalid symbol response")?;

    let symbol = decode_string(symbol_hex)?;

    Ok((symbol, decimals))
}

fn decode_string(value: &str) -> Result<String> {
    let hex = value.trim_start_matches("0x");

    if hex.len() < 128 {
        anyhow::bail!("invalid ERC-20 string response");
    }

    let length =
        usize::try_from(u64::from_str_radix(&hex[64..128], 16).context("invalid string length")?)?;

    let start = 128;
    let end = start + length * 2;

    if hex.len() < end {
        anyhow::bail!("invalid ERC-20 string data");
    }

    let mut bytes = Vec::with_capacity(length);

    for index in 0..length {
        let byte = u8::from_str_radix(&hex[start + index * 2..start + index * 2 + 2], 16)
            .context("invalid ERC-20 symbol byte")?;

        bytes.push(byte);
    }

    String::from_utf8(bytes).context("ERC-20 symbol is not valid UTF-8")
}

pub fn format_amount(amount: &str, decimals: u8) -> Result<String> {
    let decimals = usize::from(decimals);

    if decimals == 0 {
        return Ok(amount.to_string());
    }

    let padded = format!("{:0>width$}", amount, width = decimals + 1);

    let split = padded.len() - decimals;

    let integer = &padded[..split];
    let fraction = padded[split..].trim_end_matches('0');

    if fraction.is_empty() {
        Ok(integer.to_string())
    } else {
        Ok(format!("{}.{}", integer, fraction))
    }
}

fn decode_address(topic: &str) -> Result<String> {
    let value = topic.trim_start_matches("0x");

    if value.len() != 64 {
        anyhow::bail!("invalid indexed address topic");
    }

    Ok(format!("0x{}", &value[24..].to_lowercase()))
}

pub fn hex_to_decimal(value: &str) -> Result<String> {
    let value = value.trim_start_matches("0x");

    u128::from_str_radix(value, 16)
        .map(|number| number.to_string())
        .context("invalid hexadecimal transfer amount")
}

fn parse_hex_u64(value: &str) -> Result<u64> {
    u64::from_str_radix(value.trim_start_matches("0x"), 16).context("invalid hexadecimal number")
}
