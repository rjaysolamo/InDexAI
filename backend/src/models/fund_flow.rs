use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct FundFlowNode {
    pub address: String,
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FundFlowEdge {
    pub from: String,
    pub to: String,
    pub token_address: String,
    pub symbol: String,
    pub decimals: u8,
    pub amount: String,
    pub human_amount: String,
    pub log_index: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FundFlow {
    pub transaction_hash: String,
    pub nodes: Vec<FundFlowNode>,
    pub edges: Vec<FundFlowEdge>,
}
