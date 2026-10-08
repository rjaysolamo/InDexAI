mod adapters;
mod provider;
#[cfg(test)]
mod tests;

use crate::api::error::ApiError;
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::get,
};
use provider::Provider;
use serde::Serialize;
use serde_json::Value;

type Result<T> = std::result::Result<T, ApiError>;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Chain {
    Solana,
    Sui,
    Aptos,
    Bitcoin,
    Zcash,
    Monero,
}
impl Chain {
    const ALL: [Self; 6] = [
        Self::Solana,
        Self::Sui,
        Self::Aptos,
        Self::Bitcoin,
        Self::Zcash,
        Self::Monero,
    ];
    fn slug(self) -> &'static str {
        match self {
            Self::Solana => "solana",
            Self::Sui => "sui",
            Self::Aptos => "aptos",
            Self::Bitcoin => "bitcoin",
            Self::Zcash => "zcash",
            Self::Monero => "monero",
        }
    }
    fn name(self) -> &'static str {
        match self {
            Self::Solana => "Solana",
            Self::Sui => "Sui",
            Self::Aptos => "Aptos",
            Self::Bitcoin => "Bitcoin",
            Self::Zcash => "Zcash",
            Self::Monero => "Monero",
        }
    }
    fn env(self) -> &'static str {
        match self {
            Self::Solana => "SOLANA_RPC_URL",
            Self::Sui => "SUI_GRAPHQL_URL",
            Self::Aptos => "APTOS_API_URL",
            Self::Bitcoin => "BITCOIN_API_URL",
            Self::Zcash => "ZCASH_RPC_URL",
            Self::Monero => "MONERO_RPC_URL",
        }
    }
    fn default_url(self) -> Option<&'static str> {
        match self {
            Self::Solana => Some("https://api.mainnet-beta.solana.com"),
            Self::Sui => Some("https://graphql.mainnet.sui.io/graphql"),
            Self::Aptos => Some("https://api.mainnet.aptoslabs.com/v1"),
            Self::Bitcoin => Some("https://blockstream.info/api"),
            Self::Zcash => None,
            Self::Monero => Some("https://xmr-node.cakewallet.com:18081"),
        }
    }
    fn parse(s: &str) -> Result<Self> {
        Self::ALL
            .into_iter()
            .find(|c| c.slug() == s)
            .ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "Unknown chain.".into()))
    }
    fn notice(self) -> &'static str {
        match self {
            Self::Solana => {
                "Native SOL balance and up to 20 recent signatures. Token balances and complete history are not included."
            }
            Self::Sui => {
                "Native SUI balance and up to 20 recent sent transactions via GraphQL. Received activity and token balances are not included."
            }
            Self::Aptos => {
                "Native APT balance and up to 20 sent transactions returned by the fullnode. Received transfers and complete history require an indexer."
            }
            Self::Bitcoin => {
                "Confirmed balance, unconfirmed balance change and the provider's first page of address transactions via an Esplora API."
            }
            Self::Zcash => {
                "Public transaction data and address validation only. Shielded senders, recipients, amounts and balances are not publicly visible. Historical transactions require a node with txindex enabled."
            }
            Self::Monero => {
                "Public transaction metadata only. A daemon cannot reveal an address balance, history, real sender, recipient or RingCT amounts. View keys are not requested or stored."
            }
        }
    }
}

#[derive(Clone)]
pub struct Connections {
    providers: Vec<(Chain, Provider)>,
}
impl Connections {
    pub fn from_env() -> Self {
        Self {
            providers: Chain::ALL
                .into_iter()
                .map(|chain| (chain, Provider::from_env(chain)))
                .collect(),
        }
    }
    fn provider(&self, chain: Chain) -> &Provider {
        &self
            .providers
            .iter()
            .find(|(c, _)| *c == chain)
            .expect("all chains configured")
            .1
    }
}

#[derive(Serialize)]
struct ChainInfo {
    chain: &'static str,
    name: &'static str,
    configured: bool,
    notice: &'static str,
}
#[derive(Serialize)]
pub struct Field {
    label: String,
    value: String,
}
#[derive(Serialize)]
pub struct RelatedTransaction {
    hash: String,
    status: String,
    position: String,
}
#[derive(Serialize)]
pub struct Lookup {
    chain: &'static str,
    kind: String,
    target: String,
    fields: Vec<Field>,
    transactions: Vec<RelatedTransaction>,
    notices: Vec<String>,
    // Keep raw integer amounts exact across the JavaScript JSON boundary.
    public_data: String,
}
impl Lookup {
    fn new(chain: Chain, kind: &str, target: &str, data: Value) -> Self {
        Self {
            chain: chain.slug(),
            kind: kind.into(),
            target: target.into(),
            fields: vec![],
            transactions: vec![],
            notices: vec![chain.notice().into()],
            public_data: serde_json::to_string_pretty(&data).unwrap_or_default(),
        }
    }
    fn field(&mut self, label: &str, value: impl ToString) {
        self.fields.push(Field {
            label: label.into(),
            value: value.to_string(),
        });
    }
}

pub fn router(connections: Connections) -> Router {
    Router::new()
        .route("/api/v1/chains", get(list))
        .route("/api/v1/chains/{chain}/status", get(status))
        .route("/api/v1/chains/{chain}/{kind}/{target}", get(lookup))
        .with_state(connections)
}
async fn list(State(state): State<Connections>) -> Json<Vec<ChainInfo>> {
    Json(
        Chain::ALL
            .into_iter()
            .map(|chain| ChainInfo {
                chain: chain.slug(),
                name: chain.name(),
                configured: state.provider(chain).url.is_some(),
                notice: chain.notice(),
            })
            .collect(),
    )
}
async fn status(
    State(state): State<Connections>,
    Path(chain): Path<String>,
) -> Result<Json<Value>> {
    let chain = Chain::parse(&chain)?;
    let position = adapters::status(chain, state.provider(chain)).await?;
    Ok(Json(
        serde_json::json!({ "chain": chain.slug(), "status": "connected", "position": position }),
    ))
}
async fn lookup(
    State(state): State<Connections>,
    Path((chain, kind, target)): Path<(String, String, String)>,
) -> Result<Json<Lookup>> {
    let chain = Chain::parse(&chain)?;
    if !valid_target(chain, &kind, &target) {
        return Err(ApiError(
            StatusCode::BAD_REQUEST,
            "Invalid address or transaction identifier for this chain.".into(),
        ));
    }
    Ok(Json(
        adapters::lookup(chain, &kind, &target, state.provider(chain)).await?,
    ))
}
fn bad_provider() -> ApiError {
    ApiError(
        StatusCode::BAD_GATEWAY,
        "The chain provider returned an invalid response or is unavailable. Please try again."
            .into(),
    )
}
fn missing() -> ApiError {
    ApiError(
        StatusCode::NOT_FOUND,
        "No data found for this identifier. The provider may not retain its history.".into(),
    )
}
fn scalar(v: &Value) -> Result<String> {
    if let Some(s) = v.as_str() {
        return Ok(s.into());
    }
    if v.is_number() || v.is_boolean() {
        return Ok(v.to_string());
    }
    Err(bad_provider())
}
fn position(v: &Value) -> String {
    scalar(v).unwrap_or_else(|_| "Not available".into())
}
fn amount(v: &Value, decimals: usize, symbol: &str) -> Result<String> {
    let s = scalar(v)?;
    if s.is_empty() || !s.bytes().all(|b| b.is_ascii_digit()) {
        return Err(bad_provider());
    }
    let padded = format!("{:0>width$}", s, width = decimals + 1);
    let (whole, fraction) = padded.split_at(padded.len() - decimals);
    let fraction = fraction.trim_end_matches('0');
    Ok(format!(
        "{}{}{} {}",
        whole,
        if fraction.is_empty() { "" } else { "." },
        fraction,
        symbol
    ))
}
fn hex(value: &str, min: usize, max: usize) -> bool {
    (min..=max).contains(&value.len()) && value.bytes().all(|b| b.is_ascii_hexdigit())
}
fn base58(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|b| b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".contains(&b))
}
fn base58_size(value: &str, size: usize) -> bool {
    if !base58(value) || value.len() > 88 {
        return false;
    }
    let mut bytes = Vec::<u8>::new();
    for ch in value.bytes() {
        let mut carry = b"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
            .iter()
            .position(|c| *c == ch)
            .unwrap() as u32;
        for byte in &mut bytes {
            carry += u32::from(*byte) * 58;
            *byte = carry as u8;
            carry >>= 8;
        }
        while carry > 0 {
            bytes.push(carry as u8);
            carry >>= 8;
        }
    }
    bytes.len() + value.bytes().take_while(|c| *c == b'1').count() == size
}
fn bech32(value: &str, prefix: &str, min: usize, max: usize) -> bool {
    value.starts_with(prefix)
        && (min..=max).contains(&value.len())
        && value[prefix.len()..]
            .bytes()
            .all(|b| b"023456789acdefghjklmnpqrstuvwxyz".contains(&b))
}
fn valid_target(chain: Chain, kind: &str, target: &str) -> bool {
    if target.len() > 1024 {
        return false;
    }
    if kind == "transaction" {
        return match chain {
            Chain::Solana => base58_size(target, 64),
            Chain::Sui => base58_size(target, 32),
            Chain::Aptos => target.strip_prefix("0x").is_some_and(|v| hex(v, 64, 64)),
            _ => hex(target, 64, 64),
        };
    }
    if kind != "address" {
        return false;
    }
    match chain {
        Chain::Solana => base58_size(target, 32),
        Chain::Sui | Chain::Aptos => target.strip_prefix("0x").is_some_and(|v| hex(v, 1, 64)),
        Chain::Bitcoin => {
            ((target.starts_with('1') || target.starts_with('3'))
                && (26..=35).contains(&target.len())
                && base58(target))
                || bech32(target, "bc1", 14, 90)
        }
        Chain::Zcash => {
            ((target.starts_with("t1") || target.starts_with("t3"))
                && target.len() == 35
                && base58(target))
                || (target.starts_with("zc") && target.len() == 95 && base58(target))
                || bech32(target, "zs", 78, 78)
                || bech32(target, "u1", 20, 1024)
        }
        Chain::Monero => {
            (target.starts_with('4') || target.starts_with('8'))
                && [95, 106].contains(&target.len())
                && base58(target)
        }
    }
}
