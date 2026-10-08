use axum::{Json, extract::Path};
use serde::Serialize;

use crate::tracing::{funds::trace_funds, wallet::trace_wallet};

#[derive(Debug, Serialize)]
pub struct InvestigationResponse {
    pub id: String,
    pub target: String,
    pub depth: u32,
    pub message: String,
}

pub async fn get_investigation(
    Path(id): Path<String>,
) -> Result<Json<InvestigationResponse>, super::error::ApiError> {
    let target = id.clone();
    let depth = 3;
    trace_wallet(&target, depth).await?;
    trace_funds(&target, depth, None).await?;
    Ok(Json(InvestigationResponse {
        id, target, depth,
        message: "Investigation initialized. Multi-hop tracing is not implemented yet; no trace results have been generated.".into(),
    }))
}
