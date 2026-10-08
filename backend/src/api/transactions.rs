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
) -> Result<Json<TransactionResponse>, super::error::ApiError> {
    match get_transaction(&state.rpc, &hash).await {
        Ok(transaction) => Ok(Json(TransactionResponse {
            transaction: Some(transaction),
            message: "Transaction lookup successful.".into(),
        })),
        Err(error)
            if error
                .downcast_ref::<crate::indexer::transactions::TransactionNotFound>()
                .is_some() =>
        {
            Ok(Json(TransactionResponse {
                transaction: None,
                message: "Transaction not found.".into(),
            }))
        }
        Err(error) => Err(error.into()),
    }
}
