use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct TokenTransfer {
    pub chain_id: u64,
    pub tx_hash: String,
    pub token_address: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub log_index: u64,
}
