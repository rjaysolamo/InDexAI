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
) -> Json<LogsResponse> {
    match index_logs(&state.rpc, &tx_hash).await {
        Ok(transfers) => Json(LogsResponse {
            transaction_hash: tx_hash,
            transfers,
            message: "ERC-20 Transfer events decoded.".to_string(),
        }),

        Err(error) => Json(LogsResponse {
            transaction_hash: tx_hash,
            transfers: Vec::new(),
            message: error.to_string(),
        }),
    }
}

pub async fn get_fund_flow(
    State(state): State<TransactionApiState>,
    Path(tx_hash): Path<String>,
) -> Json<FundFlowResponse> {
    match index_logs(&state.rpc, &tx_hash).await {
        Ok(transfers) => match build_fund_flow(&state.rpc, &tx_hash, &transfers).await {
            Ok(fund_flow) => Json(FundFlowResponse {
                fund_flow: Some(fund_flow),
                message: "Fund flow built successfully.".to_string(),
            }),

            Err(error) => Json(FundFlowResponse {
                fund_flow: None,
                message: error.to_string(),
            }),
        },

        Err(error) => Json(FundFlowResponse {
            fund_flow: None,
            message: error.to_string(),
        }),
    }
}
