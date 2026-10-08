use super::provider::Provider;
use super::{
    Chain, Lookup, RelatedTransaction, Result, amount, bad_provider, missing, position, scalar,
};
use crate::api::error::ApiError;
use axum::http::StatusCode;
use serde_json::{Value, json};

pub async fn status(chain: Chain, provider: &Provider) -> Result<String> {
    let value = match chain {
        Chain::Solana => {
            provider
                .rpc("getSlot", json!([{"commitment":"finalized"}]))
                .await?
        }
        Chain::Sui => provider
            .graphql("{ checkpoint { sequenceNumber } }", json!({}))
            .await?["checkpoint"]["sequenceNumber"]
            .clone(),
        Chain::Aptos => provider.rest("", None).await?["ledger_version"].clone(),
        Chain::Bitcoin => provider.rest("/blocks/tip/height", None).await?,
        Chain::Zcash => provider.rpc("getblockchaininfo", json!([])).await?["blocks"].clone(),
        Chain::Monero => {
            let data = provider.rest("/get_info", None).await?;
            if data["status"] != "OK" {
                return Err(bad_provider());
            }
            data["height"].clone()
        }
    };
    scalar(&value)
}

pub async fn lookup(chain: Chain, kind: &str, target: &str, provider: &Provider) -> Result<Lookup> {
    match chain {
        Chain::Solana => solana(kind, target, provider).await,
        Chain::Sui => sui(kind, target, provider).await,
        Chain::Aptos => aptos(kind, target, provider).await,
        Chain::Bitcoin => bitcoin(kind, target, provider).await,
        Chain::Zcash => zcash(kind, target, provider).await,
        Chain::Monero => monero(kind, target, provider).await,
    }
}
fn rows(value: &Value) -> Result<&Vec<Value>> {
    value.as_array().ok_or_else(bad_provider)
}
fn found(value: Value) -> Result<Value> {
    if value.is_null() {
        Err(missing())
    } else if !value.is_object() {
        Err(bad_provider())
    } else {
        Ok(value)
    }
}
fn history_error(result: &mut Lookup) {
    result.notices.push("Activity could not be loaded. The balance or details shown above are still available; retry to request activity again.".into());
}

async fn solana(kind: &str, target: &str, p: &Provider) -> Result<Lookup> {
    if kind == "address" {
        let data = p
            .rpc("getBalance", json!([target,{"commitment":"finalized"}]))
            .await?;
        let balance = amount(&data["value"], 9, "SOL")?;
        let mut result = Lookup::new(Chain::Solana, kind, target, data);
        result.field("Finalized native balance", balance);
        match p
            .rpc(
                "getSignaturesForAddress",
                json!([target,{"limit":20,"commitment":"finalized"}]),
            )
            .await
            .and_then(|v| Ok(rows(&v)?.clone()))
        {
            Ok(items) => {
                for tx in items {
                    result.transactions.push(RelatedTransaction {
                        hash: scalar(&tx["signature"])?,
                        status: if tx["err"].is_null() {
                            "Success"
                        } else {
                            "Failed"
                        }
                        .into(),
                        position: position(&tx["slot"]),
                    });
                }
            }
            Err(_) => history_error(&mut result),
        }
        return Ok(result);
    }
    let data = found(p.rpc("getTransaction",json!([target,{"encoding":"jsonParsed","commitment":"finalized","maxSupportedTransactionVersion":0}])).await?)?;
    let slot = scalar(&data["slot"])?;
    let status = if data["meta"].is_null() {
        "Execution status unavailable"
    } else if data["meta"]["err"].is_null() {
        "Success"
    } else {
        "Failed"
    };
    let fee = if data["meta"]["fee"].is_null() {
        None
    } else {
        Some(amount(&data["meta"]["fee"], 9, "SOL")?)
    };
    let mut result = Lookup::new(Chain::Solana, kind, target, data);
    result.field("Slot", slot);
    result.field("Status", status);
    if let Some(fee) = fee {
        result.field("Fee", fee);
    }
    Ok(result)
}

const SUI_ADDRESS: &str = "query($address:SuiAddress!){address(address:$address){address balance(coinType:\"0x2::sui::SUI\"){totalBalance}}}";
const SUI_HISTORY: &str = "query($address:SuiAddress!){address(address:$address){transactions(last:20,relation:SENT){nodes{digest effects{status checkpoint{sequenceNumber}}}}}}";
const SUI_TX: &str = "query($digest:String!){transaction(digest:$digest){digest sender{address} effects{status timestamp checkpoint{sequenceNumber} balanceChangesJson} transactionJson}}";
async fn sui(kind: &str, target: &str, p: &Provider) -> Result<Lookup> {
    if kind == "address" {
        let data = p.graphql(SUI_ADDRESS, json!({"address":target})).await?;
        let address = found(data["address"].clone())?;
        // GraphQL returns null when no native balance exists.
        let native_balance = address.get("balance").ok_or_else(bad_provider)?;
        let balance = if native_balance.is_null() {
            "0 SUI".into()
        } else {
            amount(&address["balance"]["totalBalance"], 9, "SUI")?
        };
        let mut result = Lookup::new(Chain::Sui, kind, target, address);
        result.field("Native balance", balance);
        match p
            .graphql(SUI_HISTORY, json!({"address":target}))
            .await
            .and_then(|v| Ok(rows(&v["address"]["transactions"]["nodes"])?.clone()))
        {
            Ok(items) => {
                for tx in items.into_iter().rev() {
                    result.transactions.push(RelatedTransaction {
                        hash: scalar(&tx["digest"])?,
                        status: position(&tx["effects"]["status"]),
                        position: position(&tx["effects"]["checkpoint"]["sequenceNumber"]),
                    });
                }
            }
            Err(_) => history_error(&mut result),
        }
        return Ok(result);
    }
    let data = found(p.graphql(SUI_TX, json!({"digest":target})).await?["transaction"].clone())?;
    scalar(&data["digest"])?;
    let mut result = Lookup::new(Chain::Sui, kind, target, data.clone());
    result.field("Sender", position(&data["sender"]["address"]));
    result.field("Status", position(&data["effects"]["status"]));
    result.field(
        "Checkpoint",
        position(&data["effects"]["checkpoint"]["sequenceNumber"]),
    );
    Ok(result)
}

async fn aptos(kind: &str, target: &str, p: &Provider) -> Result<Lookup> {
    if kind == "address" {
        let account = found(p.rest(&format!("/accounts/{target}"), None).await?)?;
        let mut result = Lookup::new(Chain::Aptos, kind, target, account.clone());
        result.field("Sequence number", scalar(&account["sequence_number"])?);
        match p.rest("/view",Some(json!({"function":"0x1::coin::balance","type_arguments":["0x1::aptos_coin::AptosCoin"],"arguments":[target]}))).await.and_then(|v| amount(&v[0],8,"APT")) {
            Ok(balance) => result.field("Native balance",balance),
            Err(_) => result.notices.push("Native balance could not be loaded; it has not been assumed to be zero.".into()),
        }
        match p
            .rest(&format!("/accounts/{target}/transactions?limit=20"), None)
            .await
            .and_then(|v| Ok(rows(&v)?.clone()))
        {
            Ok(items) => {
                for tx in items.into_iter().rev() {
                    result.transactions.push(RelatedTransaction {
                        hash: scalar(&tx["hash"])?,
                        status: aptos_status(&tx).into(),
                        position: position(&tx["version"]),
                    });
                }
            }
            Err(_) => history_error(&mut result),
        }
        return Ok(result);
    }
    let data = found(
        p.rest(&format!("/transactions/by_hash/{target}"), None)
            .await?,
    )?;
    scalar(&data["hash"])?;
    let mut result = Lookup::new(Chain::Aptos, kind, target, data.clone());
    result.field("Status", aptos_status(&data));
    result.field("Version", position(&data["version"]));
    result.field("Sender", position(&data["sender"]));
    if !data["gas_used"].is_null() {
        result.field("Gas used (units)", scalar(&data["gas_used"])?);
    }
    Ok(result)
}
fn aptos_status(tx: &Value) -> &'static str {
    if tx["type"] == "pending_transaction" {
        "Pending"
    } else {
        match tx["success"].as_bool() {
            Some(true) => "Success",
            Some(false) => "Failed",
            None => "Unknown",
        }
    }
}
async fn bitcoin(kind: &str, target: &str, p: &Provider) -> Result<Lookup> {
    if kind == "address" {
        let data = found(p.rest(&format!("/address/{target}"), None).await?)?;
        let balance = |key: &str| -> Result<i128> {
            let stats = &data[key];
            Ok(
                i128::from(stats["funded_txo_sum"].as_u64().ok_or_else(bad_provider)?)
                    - i128::from(stats["spent_txo_sum"].as_u64().ok_or_else(bad_provider)?),
            )
        };
        let confirmed = balance("chain_stats")?;
        let unconfirmed = balance("mempool_stats")?;
        if confirmed < 0 {
            return Err(bad_provider());
        }
        let mut result = Lookup::new(Chain::Bitcoin, kind, target, data.clone());
        result.field(
            "Confirmed balance",
            amount(&json!(confirmed.to_string()), 8, "BTC")?,
        );
        result.field(
            "Unconfirmed balance change",
            format!(
                "{}{}",
                if unconfirmed < 0 { "-" } else { "+" },
                amount(&json!(unconfirmed.abs().to_string()), 8, "BTC")?
            ),
        );
        match p
            .rest(&format!("/address/{target}/txs"), None)
            .await
            .and_then(|v| Ok(rows(&v)?.clone()))
        {
            Ok(items) => {
                for tx in items.into_iter().take(75) {
                    result.transactions.push(RelatedTransaction {
                        hash: scalar(&tx["txid"])?,
                        status: if tx["status"]["confirmed"] == true {
                            "Confirmed"
                        } else {
                            "Unconfirmed"
                        }
                        .into(),
                        position: position(&tx["status"]["block_height"]),
                    });
                }
            }
            Err(_) => history_error(&mut result),
        }
        return Ok(result);
    }
    let data = found(p.rest(&format!("/tx/{target}"), None).await?)?;
    scalar(&data["txid"])?;
    let confirmed = data["status"]["confirmed"]
        .as_bool()
        .ok_or_else(bad_provider)?;
    let mut result = Lookup::new(Chain::Bitcoin, kind, target, data.clone());
    result.field(
        "Status",
        if confirmed {
            "Confirmed"
        } else {
            "Unconfirmed"
        },
    );
    result.field("Block", position(&data["status"]["block_height"]));
    result.field("Fee", amount(&data["fee"], 8, "BTC")?);
    result.field("Inputs", rows(&data["vin"])?.len());
    result.field("Outputs", rows(&data["vout"])?.len());
    result.notices.push("Inputs and outputs can include change. They do not by themselves establish wallet ownership.".into());
    Ok(result)
}
async fn zcash(kind: &str, target: &str, p: &Provider) -> Result<Lookup> {
    if kind == "address" {
        let method = if target.starts_with("u1") {
            "z_listunifiedreceivers"
        } else if target.starts_with('t') {
            "validateaddress"
        } else {
            "z_validateaddress"
        };
        let data = p.rpc(method, json!([target])).await?;
        if method == "z_listunifiedreceivers" {
            if !data.is_object() || data.as_object().is_none_or(|v| v.is_empty()) {
                return Err(bad_provider());
            }
        } else {
            match data["isvalid"].as_bool() {
                Some(true) => (),
                Some(false) => {
                    return Err(ApiError(
                        StatusCode::BAD_REQUEST,
                        "The Zcash node rejected this address.".into(),
                    ));
                }
                None => return Err(bad_provider()),
            }
        }
        // validateaddress may include node-wallet metadata; never expose it.
        let public = json!({"address":target,"isvalid":true});
        let mut result = Lookup::new(Chain::Zcash, kind, target, public);
        result.field("Address format", "Validated by node");
        result.field(
            "Balance and history",
            "Unavailable through this node connection",
        );
        return Ok(result);
    }
    let data = found(p.rpc("getrawtransaction", json!([target, 1])).await?)?;
    scalar(&data["txid"])?;
    let mut result = Lookup::new(Chain::Zcash, kind, target, data.clone());
    result.field("Confirmations", position(&data["confirmations"]));
    result.field("Block hash", position(&data["blockhash"]));
    result.field("Transparent outputs", rows(&data["vout"])?.len());
    result.notices.push("Shielded commitments and ciphertext are not decoded transfers. Hidden amounts must not be interpreted as zero.".into());
    Ok(result)
}
async fn monero(kind: &str, target: &str, p: &Provider) -> Result<Lookup> {
    if kind == "address" {
        let mut result = Lookup::new(Chain::Monero, kind, target, Value::Null);
        result.field("Public address lookup", "Not supported by Monero");
        result.notices.push("Only the identifier's format was checked, not its checksum. No address was sent to the daemon. Connection status is available on the Chains page.".into());
        return Ok(result);
    }
    let data = p
        .rest(
            "/get_transactions",
            Some(json!({"txs_hashes":[target],"decode_as_json":true,"prune":true})),
        )
        .await?;
    if data["status"] != "OK" {
        return Err(bad_provider());
    }
    if data["missed_tx"]
        .as_array()
        .is_some_and(|items| !items.is_empty())
    {
        return Err(missing());
    }
    let tx = rows(&data["txs"])?.first().ok_or_else(missing)?;
    scalar(&tx["tx_hash"])?;
    let in_pool = tx["in_pool"].as_bool().ok_or_else(bad_provider)?;
    let mut result = Lookup::new(Chain::Monero, kind, target, tx.clone());
    result.field(
        "Status",
        if in_pool {
            "In transaction pool"
        } else {
            "Mined"
        },
    );
    result.field(
        "Block",
        if in_pool {
            "Pending".into()
        } else {
            position(&tx["block_height"])
        },
    );
    result.field("Confirmations", position(&tx["confirmations"]));
    result.field(
        "Sender / recipient / RingCT amounts",
        "Not publicly visible",
    );
    Ok(result)
}
