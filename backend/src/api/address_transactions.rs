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
) -> Json<AddressTransactionsResponse> {
    match state.rpc.block_number().await {
        Ok(latest_block) => {
            match get_address_transactions(&state.rpc, &address, latest_block, 100).await {
                Ok(transactions) => Json(AddressTransactionsResponse {
                    address,
                    transactions,
                    message: "Address transactions lookup successful.".to_string(),
                }),
                Err(error) => Json(AddressTransactionsResponse {
                    address,
                    transactions: Vec::new(),
                    message: error.to_string(),
                }),
            }
        }

        Err(error) => Json(AddressTransactionsResponse {
            address,
            transactions: Vec::new(),
            message: error.to_string(),
        }),
    }
}
