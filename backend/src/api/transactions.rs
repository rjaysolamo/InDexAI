use axum::{
    Json,
    extract::{Path, State},
};
use serde::Serialize;

use crate::{indexer::transactions::get_transaction, rpc::RpcClient};

#[derive(Clone)]
pub struct TransactionApiState {
    pub rpc: RpcClient,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub transaction: Option<crate::models::transaction::Transaction>,
    pub message: String,
}

pub async fn get_transaction_handler(
    State(state): State<TransactionApiState>,
    Path(hash): Path<String>,
) -> Json<TransactionResponse> {
    match get_transaction(&state.rpc, &hash).await {
        Ok(transaction) => Json(TransactionResponse {
            transaction: Some(transaction),
            message: "Transaction lookup successful.".to_string(),
        }),

        Err(error) => Json(TransactionResponse {
            transaction: None,
            message: error.to_string(),
        }),
    }
}
