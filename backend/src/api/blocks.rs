use crate::indexer::blocks::index_block;
use axum::{Json, extract::Path};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BlockResponse {
    pub block_number: u64,
    pub message: String,
}

pub async fn get_block(Path(block_number): Path<u64>) -> Json<BlockResponse> {
    let result = index_block(block_number).await;

    match result {
        Ok(number) => Json(BlockResponse {
            block_number: number,
            message: "Block accepted for indexing.".to_string(),
        }),
        Err(error) => Json(BlockResponse {
            block_number,
            message: error.to_string(),
        }),
    }
}
