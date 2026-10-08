use crate::indexer::blocks::index_block;
use axum::{Json, extract::Path};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BlockResponse {
    pub block_number: u64,
    pub message: String,
}

pub async fn get_block(
    Path(block_number): Path<u64>,
) -> Result<Json<BlockResponse>, super::error::ApiError> {
    let number = index_block(block_number).await.map_err(|error| {
        super::error::ApiError(axum::http::StatusCode::BAD_REQUEST, error.to_string())
    })?;
    Ok(Json(BlockResponse {
        block_number: number,
        message: "Block request validated. Block indexing is not implemented yet.".into(),
    }))
}
