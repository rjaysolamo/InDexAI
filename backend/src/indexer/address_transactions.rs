use anyhow::{Context, Result};
use serde::Serialize;
use serde_json::{Value, json};
use std::collections::HashMap;

use crate::rpc::RpcClient;

#[derive(Debug, Clone, Serialize)]
pub struct AddressTransaction {
    pub hash: String,
    pub block_number: Option<u64>,
    pub from_address: String,
    pub to_address: Option<String>,
    pub value: String,
    pub asset: Option<String>,
    pub category: Option<String>,
    pub direction: String,
}

pub async fn get_address_transactions(
    rpc: &RpcClient,
    address: &str,
    _block_number: u64,
    limit: u64,
) -> Result<Vec<AddressTransaction>> {
    let mut transactions = HashMap::new();

    for field in ["fromAddress", "toAddress"] {
        let result = rpc
            .call(
                "alchemy_getAssetTransfers",
                json!([{
                    field: address,
                    "category": ["external", "erc20"],
                    "withMetadata": false,
                    "maxCount": format!("0x{:x}", limit),
                    "order": "desc"
                }]),
            )
            .await?;

        let transfers = result
            .get("transfers")
            .and_then(Value::as_array)
            .context("Alchemy transfers missing")?;

        for transfer in transfers {
            let hash = transfer
                .get("hash")
                .and_then(Value::as_str)
                .context("transfer hash missing")?;

            let from = transfer
                .get("from")
                .and_then(Value::as_str)
                .context("transfer sender missing")?;

            let to = transfer
                .get("to")
                .and_then(Value::as_str)
                .map(str::to_string);

            let block_number = transfer
                .get("blockNum")
                .and_then(Value::as_str)
                .map(parse_hex_u64)
                .transpose()?;

            let value = transfer
                .get("value")
                .map(|value| value.to_string())
                .unwrap_or_else(|| "0".to_string());

            let asset = transfer
                .get("asset")
                .and_then(Value::as_str)
                .map(str::to_string);

            let category = transfer
                .get("category")
                .and_then(Value::as_str)
                .map(str::to_string);

            transactions.insert(
                hash.to_string(),
                AddressTransaction {
                    hash: hash.to_string(),
                    block_number,
                    from_address: from.to_string(),
                    to_address: to,
                    value,
                    asset,
                    category,
                    direction: if from.eq_ignore_ascii_case(address) {
                        "OUT".to_string()
                    } else {
                        "IN".to_string()
                    },
                },
            );
        }
    }

    let mut transactions: Vec<_> = transactions.into_values().collect();

    transactions.sort_by(|a, b| {
        b.block_number
            .unwrap_or_default()
            .cmp(&a.block_number.unwrap_or_default())
    });

    transactions.truncate(limit as usize);

    Ok(transactions)
}

fn parse_hex_u64(value: &str) -> Result<u64> {
    u64::from_str_radix(value.trim_start_matches("0x"), 16)
        .context("invalid hexadecimal block number")
}
