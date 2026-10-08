use super::{
    address_transactions::get_address_transactions_handler,
    blocks::get_block,
    error::ApiError,
    logs::{get_fund_flow, get_logs},
    transactions::{TransactionApiState, get_transaction_handler},
};
use crate::{rpc::RpcClient, scan_erc20};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
};
use serde_json::json;

async fn provider(result: serde_json::Value) -> (TransactionApiState, tokio::task::JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    let app = Router::new().route(
        "/",
        post(move || {
            let result = result.clone();
            async move { Json(result) }
        }),
    );
    let task = tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    (
        TransactionApiState {
            rpc: RpcClient::new(url),
        },
        task,
    )
}

#[tokio::test]
async fn provider_failures_are_errors_not_empty_successes() {
    let (state, task) =
        provider(json!({"error":{"code":-32000,"message":"provider failure"}})).await;
    let hash = format!("0x{}", "1".repeat(64));
    assert_eq!(
        get_transaction_handler(State(state.clone()), Path(hash.clone()))
            .await
            .into_response()
            .status(),
        StatusCode::BAD_GATEWAY
    );
    assert_eq!(
        get_logs(State(state.clone()), Path(hash.clone()))
            .await
            .into_response()
            .status(),
        StatusCode::BAD_GATEWAY
    );
    assert_eq!(
        get_fund_flow(State(state.clone()), Path(hash))
            .await
            .into_response()
            .status(),
        StatusCode::BAD_GATEWAY
    );
    assert_eq!(
        get_address_transactions_handler(
            State(state.clone()),
            Path(format!("0x{}", "1".repeat(40)))
        )
        .await
        .into_response()
        .status(),
        StatusCode::BAD_GATEWAY
    );
    assert_eq!(
        scan_erc20(State(state), Path((1, 1)))
            .await
            .into_response()
            .status(),
        StatusCode::BAD_GATEWAY
    );
    task.abort();
}

#[tokio::test]
async fn missing_transaction_is_distinct_from_provider_failure() {
    let (state, task) = provider(json!({"result":null})).await;
    let response = get_transaction_handler(State(state), Path(format!("0x{}", "1".repeat(64))))
        .await
        .into_response();
    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), 4096)
        .await
        .unwrap();
    let body: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(body["transaction"].is_null());
    assert_eq!(body["message"], "Transaction not found.");
    task.abort();
}

#[tokio::test]
async fn empty_scan_is_a_success_and_invalid_ranges_are_rejected() {
    let (state, task) = provider(json!({"result":[]})).await;
    let response = scan_erc20(State(state.clone()), Path((0, 99)))
        .await
        .into_response();
    assert_eq!(response.status(), StatusCode::OK);
    for range in [(2, 1), (0, 100), (0, u64::MAX)] {
        assert_eq!(
            scan_erc20(State(state.clone()), Path(range))
                .await
                .into_response()
                .status(),
            StatusCode::BAD_REQUEST
        );
    }
    assert_eq!(
        get_block(Path(0)).await.into_response().status(),
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        get_block(Path(1)).await.into_response().status(),
        StatusCode::OK
    );
    task.abort();
}

#[tokio::test]
async fn error_response_does_not_expose_provider_details() {
    let response =
        ApiError::from(anyhow::anyhow!("https://provider.test/private-key")).into_response();
    let body = axum::body::to_bytes(response.into_body(), 4096)
        .await
        .unwrap();
    assert!(!String::from_utf8_lossy(&body).contains("private-key"));
}
