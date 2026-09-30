use anyhow::{Context, Result};
use reqwest::Client;
use serde_json::{Value, json};

#[derive(Clone)]
pub struct RpcClient {
    client: Client,
    url: String,
}

impl RpcClient {
    pub fn new(url: String) -> Self {
        Self {
            client: Client::new(),
            url,
        }
    }

    pub async fn call(&self, method: &str, params: Value) -> Result<Value> {
        let response = self
            .client
            .post(&self.url)
            .json(&json!({
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params
            }))
            .timeout(std::time::Duration::from_secs(10))
            .send()
            .await
            .context("RPC request timed out")?;

        let status = response.status();

        let body = response
            .json::<Value>()
            .await
            .context("failed to decode JSON-RPC response")?;

        if let Some(error) = body.get("error") {
            let code = error.get("code").and_then(Value::as_i64).unwrap_or(0);

            let message = error
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("unknown RPC error");

            anyhow::bail!("Ethereum RPC error {}: {}", code, message);
        }

        if !status.is_success() {
            anyhow::bail!("RPC request failed with HTTP status {}", status);
        }

        body.get("result")
            .cloned()
            .context("JSON-RPC response does not contain result")
    }

    pub async fn block_number(&self) -> Result<u64> {
        let result = self.call("eth_blockNumber", json!([])).await?;

        let value = result
            .as_str()
            .context("eth_blockNumber result is not a string")?;

        u64::from_str_radix(value.trim_start_matches("0x"), 16)
            .context("invalid Ethereum block number")
    }

    pub async fn get_logs(&self, filter: Value) -> Result<Vec<Value>> {
        let result = self.call("eth_getLogs", json!([filter])).await?;

        result
            .as_array()
            .cloned()
            .context("eth_getLogs result is not an array")
    }
}
