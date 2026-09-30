use anyhow::{Context, Result};
use serde_json::json;

use crate::{models::transaction::Transaction, rpc::RpcClient};

pub async fn get_transaction(rpc: &RpcClient, tx_hash: &str) -> Result<Transaction> {
    let transaction = rpc
        .call("eth_getTransactionByHash", json!([tx_hash]))
        .await?;

    if transaction.is_null() {
        anyhow::bail!("transaction not found");
    }

    let hash = transaction
        .get("hash")
        .and_then(|value| value.as_str())
        .context("transaction hash missing")?
        .to_string();

    let from_address = transaction
        .get("from")
        .and_then(|value| value.as_str())
        .context("transaction sender missing")?
        .to_string();

    let to_address = transaction
        .get("to")
        .and_then(|value| value.as_str())
        .map(str::to_string);

    let value = transaction
        .get("value")
        .and_then(|value| value.as_str())
        .context("transaction value missing")?
        .to_string();

    let gas = transaction
        .get("gas")
        .and_then(|value| value.as_str())
        .context("transaction gas missing")?
        .to_string();

    let gas_price = transaction
        .get("gasPrice")
        .and_then(|value| value.as_str())
        .map(str::to_string);

    let block_number = transaction
        .get("blockNumber")
        .and_then(|value| value.as_str())
        .map(parse_hex_u64)
        .transpose()?;

    let receipt = rpc
        .call("eth_getTransactionReceipt", json!([tx_hash]))
        .await?;

    let status = receipt
        .get("status")
        .and_then(|value| value.as_str())
        .map(parse_hex_u64)
        .transpose()?;

    Ok(Transaction {
        hash,
        block_number,
        from_address,
        to_address,
        value,
        gas,
        gas_price,
        status,
    })
}

fn parse_hex_u64(value: &str) -> Result<u64> {
    u64::from_str_radix(value.trim_start_matches("0x"), 16).context("invalid hexadecimal number")
}
