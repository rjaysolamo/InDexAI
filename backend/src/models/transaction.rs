use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Transaction {
    pub hash: String,
    pub block_number: Option<u64>,
    pub from_address: String,
    pub to_address: Option<String>,
    pub value: String,
    pub gas: String,
    pub gas_price: Option<String>,
    pub status: Option<u64>,
}
