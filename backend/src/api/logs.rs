use axum::{
    Json,
    extract::{Path, State},
};
use serde::Serialize;

use crate::{
    api::transactions::TransactionApiState,
    indexer::logs::{build_fund_flow, index_logs},
    models::{fund_flow::FundFlow, token::TokenTransfer},
};

#[derive(Debug, Serialize)]
pub struct LogsResponse {
    pub transaction_hash: String,
    pub transfers: Vec<TokenTransfer>,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct FundFlowResponse {
    pub fund_flow: Option<FundFlow>,
    pub message: String,
}

pub async fn get_logs(
    State(state): State<TransactionApiState>,
    Path(tx_hash): Path<String>,
) -> Result<Json<LogsResponse>, super::error::ApiError> {
    let transfers = index_logs(&state.rpc, &tx_hash).await?;
    Ok(Json(LogsResponse {
        transaction_hash: tx_hash,
        transfers,
        message: "ERC-20 Transfer events decoded.".into(),
    }))
}

pub async fn get_fund_flow(
    State(state): State<TransactionApiState>,
    Path(tx_hash): Path<String>,
) -> Result<Json<FundFlowResponse>, super::error::ApiError> {
    let transfers = index_logs(&state.rpc, &tx_hash).await?;
    let fund_flow = build_fund_flow(&state.rpc, &tx_hash, &transfers).await?;
    Ok(Json(FundFlowResponse {
        fund_flow: Some(fund_flow),
        message: "Fund flow built successfully.".into(),
    }))
}
