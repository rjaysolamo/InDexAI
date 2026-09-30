use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Address {
    pub chain_id: i64,
    pub address: String,
    pub label: Option<String>,
}
