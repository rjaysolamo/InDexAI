use axum::{
    Json,
    extract::{Path, State},
};
use serde::Serialize;

use crate::{
    api::transactions::TransactionApiState, indexer::address_transactions::get_address_transactions,
};

#[derive(Debug, Serialize)]
pub struct AddressTransactionsResponse {
    pub address: String,
    pub transactions: Vec<crate::indexer::address_transactions::AddressTransaction>,
    pub message: String,
}

pub async fn get_address_transactions_handler(
    State(state): State<TransactionApiState>,
    Path(address): Path<String>,
) -> Result<Json<AddressTransactionsResponse>, super::error::ApiError> {
    let latest_block = state.rpc.block_number().await?;
    let transactions = get_address_transactions(&state.rpc, &address, latest_block, 100).await?;
    Ok(Json(AddressTransactionsResponse {
        address,
        transactions,
        message: "Address transactions lookup successful.".into(),
    }))
}
