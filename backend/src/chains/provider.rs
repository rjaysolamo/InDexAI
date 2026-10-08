use super::{Chain, Result, bad_provider, missing};
use crate::api::error::ApiError;
use axum::http::StatusCode;
use reqwest::{Client, Method};
use serde_json::{Value, json};

#[derive(Clone)]
pub struct Provider {
    pub url: Option<String>,
    client: Client,
    auth: Option<(String, String)>,
}
impl Provider {
    pub fn from_env(chain: Chain) -> Self {
        let url = std::env::var(chain.env())
            .ok()
            .or_else(|| chain.default_url().map(str::to_owned))
            .filter(|s| !s.trim().is_empty());
        let auth = if chain == Chain::Zcash {
            std::env::var("ZCASH_RPC_USER")
                .ok()
                .zip(std::env::var("ZCASH_RPC_PASSWORD").ok())
        } else {
            None
        };
        Self::new(url, auth)
    }
    pub fn new(url: Option<String>, auth: Option<(String, String)>) -> Self {
        Self {
            url: url.map(|s| s.trim_end_matches('/').into()),
            client: Client::new(),
            auth,
        }
    }
    async fn response(&self, path: &str, body: Option<Value>) -> Result<reqwest::Response> {
        let url = self.url.as_ref().ok_or_else(|| ApiError(StatusCode::SERVICE_UNAVAILABLE, "This chain connection is not configured. Ask the server operator to configure its provider.".into()))?;
        let mut request = self
            .client
            .request(
                if body.is_some() {
                    Method::POST
                } else {
                    Method::GET
                },
                format!("{url}{path}"),
            )
            .timeout(std::time::Duration::from_secs(12));
        if let Some(body) = body {
            request = request.json(&body);
        }
        if let Some((user, password)) = &self.auth {
            request = request.basic_auth(user, Some(password));
        }
        request.send().await.map_err(|_| bad_provider())
    }
    pub async fn rest(&self, path: &str, body: Option<Value>) -> Result<Value> {
        let response = self.response(path, body).await?;
        if response.status() == StatusCode::NOT_FOUND {
            return Err(missing());
        }
        if !response.status().is_success() {
            return Err(bad_provider());
        }
        response.json().await.map_err(|_| bad_provider())
    }
    pub async fn rpc(&self, method: &str, params: Value) -> Result<Value> {
        let response = self
            .response(
                "",
                Some(json!({"jsonrpc":"2.0","id":1,"method":method,"params":params})),
            )
            .await?;
        let status = response.status();
        let body: Value = response.json().await.map_err(|_| bad_provider())?;
        if !body["error"].is_null() {
            if [
                "validateaddress",
                "z_validateaddress",
                "z_listunifiedreceivers",
            ]
            .contains(&method)
                && [-5, -8].contains(&body["error"]["code"].as_i64().unwrap_or(0))
            {
                return Err(ApiError(
                    StatusCode::BAD_REQUEST,
                    "The Zcash node rejected this address.".into(),
                ));
            }

            if method == "getrawtransaction" && body["error"]["code"] == -5 {
                return Err(ApiError(StatusCode::NOT_FOUND, "Transaction unavailable. Historical Zcash lookups require txindex=1 on the configured node.".into()));
            }
            return Err(bad_provider());
        }
        if !status.is_success() {
            return Err(bad_provider());
        }
        body.get("result").cloned().ok_or_else(bad_provider)
    }
    pub async fn graphql(&self, query: &str, variables: Value) -> Result<Value> {
        let response = self
            .rest("", Some(json!({"query":query,"variables":variables})))
            .await?;
        if response["errors"]
            .as_array()
            .is_some_and(|errors| !errors.is_empty())
        {
            return Err(bad_provider());
        }
        response
            .get("data")
            .filter(|v| v.is_object())
            .cloned()
            .ok_or_else(bad_provider)
    }
}
