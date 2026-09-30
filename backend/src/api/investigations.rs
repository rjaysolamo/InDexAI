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

pub async fn get_investigation(Path(id): Path<String>) -> Json<InvestigationResponse> {
    let target = id.clone();
    let depth = 3;

    let _ = trace_wallet(&target, depth).await;
    let _ = trace_funds(&target, depth, None).await;

    Json(InvestigationResponse {
        id,
        target,
        depth,
        message: "Investigation initialized.".to_string(),
    })
}
