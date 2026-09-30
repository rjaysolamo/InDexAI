mod api;
mod config;
mod db;
mod indexer;
mod labels;
mod models;
mod rpc;
mod tracing;

use anyhow::Result;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::get,
};
use serde::Serialize;
use std::net::SocketAddr;

use api::addresses::get_address;
use api::blocks::get_block;
use api::investigations::get_investigation;
use api::logs::{get_fund_flow, get_logs};
use api::transactions::{TransactionApiState, get_transaction_handler};
use indexer::erc20::scan_transfer_logs;

#[derive(Debug, Serialize)]
struct Erc20ScanResponse {
    from_block: u64,
    to_block: u64,
    transfers: Vec<indexer::erc20::Erc20Transfer>,
    message: String,
}

async fn scan_erc20(
    State(state): State<TransactionApiState>,
    Path((from_block, to_block)): Path<(u64, u64)>,
) -> Json<Erc20ScanResponse> {
    match scan_transfer_logs(&state.rpc, from_block, to_block).await {
        Ok(transfers) => Json(Erc20ScanResponse {
            from_block,
            to_block,
            transfers,
            message: "ERC-20 Transfer scan completed.".to_string(),
        }),
        Err(error) => Json(Erc20ScanResponse {
            from_block,
            to_block,
            transfers: Vec::new(),
            message: error.to_string(),
        }),
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let config = config::Config::from_env()?;

    let _pool = db::initialize(&config).await?;

    let rpc = rpc::RpcClient::new(config.rpc_url.clone());

    let latest_block = rpc.block_number().await?;

    println!("Latest Ethereum block: {}", latest_block);

    let app_state = TransactionApiState { rpc: rpc.clone() };

    let app: Router = Router::new()
        .route("/", get(root))
        .route("/health", get(health))
        .route("/api/v1/addresses/{address}", get(get_address))
        .route("/api/v1/transactions/{hash}", get(get_transaction_handler))
        .route("/api/v1/investigations/{id}", get(get_investigation))
        .route("/api/v1/blocks/{block_number}", get(get_block))
        .route("/api/v1/transactions/{hash}/logs", get(get_logs))
        .route("/api/v1/transactions/{hash}/fund-flow", get(get_fund_flow))
        .route(
            "/api/v1/indexer/erc20/{from_block}/{to_block}",
            get(scan_erc20),
        )
        .with_state(app_state);

    let address = SocketAddr::from((config.host, config.port));

    println!("=================================");
    println!("          InDexAI Backend");
    println!("=================================");
    println!("Server: http://{}", address);
    println!("Health: http://{}/health", address);
    println!();

    let listener = tokio::net::TcpListener::bind(address).await?;

    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "InDexAI Blockchain Investigation API"
}

async fn health() -> &'static str {
    "OK"
}
