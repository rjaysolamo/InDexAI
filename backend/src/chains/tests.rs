use super::*;
use axum::{
    extract::{Request, State},
    response::IntoResponse,
    routing::any,
};
use serde_json::json;
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
struct Mock {
    calls: Arc<Mutex<Vec<(String, Value)>>>,
    fail: bool,
    override_response: Option<(StatusCode, Value)>,
    authorizations: Arc<Mutex<Vec<Option<String>>>>,
}
async fn respond(State(state): State<Mock>, request: Request) -> axum::response::Response {
    let path = request.uri().path().to_string();
    state.authorizations.lock().unwrap().push(
        request
            .headers()
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .map(str::to_owned),
    );
    let bytes = axum::body::to_bytes(request.into_body(), 1024 * 1024)
        .await
        .unwrap();
    let body: Value = serde_json::from_slice(&bytes).unwrap_or(Value::Null);
    state
        .calls
        .lock()
        .unwrap()
        .push((path.clone(), body.clone()));
    if let Some((status, value)) = state.override_response {
        return (status, Json(value)).into_response();
    }
    if state.fail {
        return (
            StatusCode::BAD_GATEWAY,
            Json(json!({"private":"provider-secret"})),
        )
            .into_response();
    }
    let hash = "a".repeat(64);
    let result = match body["method"].as_str() {
        Some("getSlot") => json!(123),
        Some("getBalance") => json!({"value":1234567890}),
        Some("getSignaturesForAddress") => {
            json!([{"signature":"1".repeat(64),"slot":123,"err":null}])
        }
        Some("getTransaction") => json!({"slot":123,"meta":{"err":null,"fee":5000}}),
        Some("getblockchaininfo") => json!({"blocks":123}),
        Some("validateaddress" | "z_validateaddress") => {
            json!({"isvalid":true,"ismine":true,"private_wallet_metadata":"DO_NOT_EXPOSE"})
        }
        Some("z_listunifiedreceivers") => json!({"orchard":"u1receiver"}),
        Some("getrawtransaction") => {
            json!({"txid":hash,"confirmations":3,"vout":[],"blockhash":"b".repeat(64)})
        }
        _ => Value::Null,
    };
    if body.get("method").is_some() {
        return Json(json!({"result":result})).into_response();
    }
    if let Some(query) = body["query"].as_str() {
        let data = if query.contains("transactions(last:") {
            json!({"address":{"transactions":{"nodes":[{"digest":"1".repeat(32),"effects":{"status":"SUCCESS","checkpoint":{"sequenceNumber":123}}}]}}})
        } else if query.contains("balance(") {
            json!({"address":{"address":"0x2","balance":{"totalBalance":"1000000001"}}})
        } else if query.contains("transaction(digest:") {
            json!({"transaction":{"digest":"1".repeat(32),"sender":{"address":"0x2"},"effects":{"status":"SUCCESS","checkpoint":{"sequenceNumber":123}}}})
        } else {
            json!({"checkpoint":{"sequenceNumber":123}})
        };
        return Json(json!({"data":data})).into_response();
    }
    let result = match path.as_str() {
        "/" => json!({"ledger_version":"123"}),
        "/accounts/0x1" => json!({"sequence_number":"12"}),
        "/accounts/0x1/transactions" => {
            json!([{"hash":format!("0x{hash}"),"success":true,"version":"123"}])
        }
        "/view" => json!(["11120868786"]),
        "/blocks/tip/height" => json!(123),
        "/get_info" => json!({"height":123,"status":"OK"}),
        "/get_transactions" => {
            json!({"status":"OK","txs":[{"tx_hash":hash,"in_pool":false,"block_height":123,"confirmations":3,"as_json":"{\"rct_signatures\":{\"type\":6}}"}]})
        }
        p if p.starts_with("/transactions/by_hash/") => {
            json!({"hash":format!("0x{hash}"),"type":"user_transaction","success":true,"version":"123","gas_used":"42","sender":"0x1"})
        }
        p if p.ends_with("/txs") => {
            json!([{"txid":hash,"status":{"confirmed":true,"block_height":123}}])
        }
        p if p.starts_with("/address/") => {
            json!({"chain_stats":{"funded_txo_sum":123456789,"spent_txo_sum":0},"mempool_stats":{"funded_txo_sum":0,"spent_txo_sum":10}})
        }
        p if p.starts_with("/tx/") => {
            json!({"txid":hash,"fee":1234,"vin":[{}],"vout":[{}],"status":{"confirmed":true,"block_height":123}})
        }
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    Json(result).into_response()
}
async fn mock(fail: bool) -> (Provider, Mock, tokio::task::JoinHandle<()>) {
    start_mock(Mock {
        fail,
        ..Default::default()
    })
    .await
}
async fn start_mock(state: Mock) -> (Provider, Mock, tokio::task::JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    let app = Router::new()
        .route("/", any(respond))
        .route("/{*path}", any(respond))
        .with_state(state.clone());
    let task = tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    (Provider::new(Some(url), None), state, task)
}
#[test]
fn shared_identifier_contract() {
    let cases: Value =
        serde_json::from_str(include_str!("../../../data/chain-targets.json")).unwrap();
    for case in cases.as_array().unwrap() {
        if case["chain"] == "ethereum" {
            continue;
        }
        let chain = Chain::parse(case["chain"].as_str().unwrap()).unwrap();
        assert_eq!(
            valid_target(
                chain,
                case["kind"].as_str().unwrap(),
                case["value"].as_str().unwrap()
            ),
            case["valid"].as_bool().unwrap(),
            "{}",
            case
        );
    }
}
#[tokio::test]
async fn all_connections_and_transactions_use_expected_protocols() {
    let (p, state, task) = mock(false).await;
    for chain in Chain::ALL {
        assert_eq!(adapters::status(chain, &p).await.unwrap(), "123");
        let hash = match chain {
            Chain::Solana => "1".repeat(64),
            Chain::Sui => "1".repeat(32),
            Chain::Aptos => format!("0x{}", "a".repeat(64)),
            _ => "a".repeat(64),
        };
        let result = adapters::lookup(chain, "transaction", &hash, &p)
            .await
            .unwrap();
        assert_eq!(result.chain, chain.slug());
        assert!(!result.fields.is_empty());
        assert!(!result.public_data.is_empty());
    }
    let calls = state.calls.lock().unwrap();
    assert!(calls.iter().any(|(_, v)| v["method"] == "getTransaction"
        && v["params"][1]["maxSupportedTransactionVersion"] == 0));
    assert!(calls.iter().any(|(_, v)| {
        v["query"]
            .as_str()
            .is_some_and(|q| q.contains("transaction(digest:"))
            && !v["variables"]["digest"].is_null()
    }));
    assert!(calls.iter().any(|(path, v)| path == "/get_transactions"
        && v["decode_as_json"] == true
        && v["prune"] == true));
    task.abort();
}
#[tokio::test]
async fn public_address_balances_are_exact_and_private_data_is_not_invented() {
    let (p, state, task) = mock(false).await;
    for (chain, target, balance) in [
        (
            Chain::Solana,
            "11111111111111111111111111111111",
            "1.23456789 SOL",
        ),
        (Chain::Sui, "0x2", "1.000000001 SUI"),
        (Chain::Aptos, "0x1", "111.20868786 APT"),
        (
            Chain::Bitcoin,
            "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
            "1.23456789 BTC",
        ),
    ] {
        let result = adapters::lookup(chain, "address", target, &p)
            .await
            .unwrap();
        assert!(result.fields.iter().any(|f| f.value == balance));
        assert_eq!(result.transactions.len(), 1);
        if chain == Chain::Bitcoin {
            assert!(result.fields.iter().any(|f| f.value == "-0.0000001 BTC"));
        }
    }
    let zcash = adapters::lookup(Chain::Zcash, "address", "t1test", &p)
        .await
        .unwrap();
    assert!(!zcash.public_data.contains("DO_NOT_EXPOSE"));
    assert!(!zcash.public_data.contains("ismine"));
    let count = state.calls.lock().unwrap().len();
    let monero = adapters::lookup(Chain::Monero, "address", "4test", &p)
        .await
        .unwrap();
    assert_eq!(
        state.calls.lock().unwrap().len(),
        count,
        "Monero address must not be sent to daemon"
    );
    assert!(monero.transactions.is_empty());
    assert_eq!(monero.public_data, "null");
    assert!(monero.fields.iter().all(|f| f.value != "0 XMR"));
    task.abort();
}
#[tokio::test]
async fn failures_do_not_leak_secrets_and_unconfigured_provider_is_explicit() {
    let (p, _, task) = mock(true).await;
    for chain in Chain::ALL {
        let error = adapters::status(chain, &p).await.unwrap_err();
        assert_eq!(error.0, StatusCode::BAD_GATEWAY);
        assert!(!error.1.contains("provider-secret"));
    }
    let error = adapters::status(Chain::Zcash, &Provider::new(None, None))
        .await
        .unwrap_err();
    assert_eq!(error.0, StatusCode::SERVICE_UNAVAILABLE);
    task.abort();
}

#[tokio::test]
async fn missing_and_malformed_data_are_distinguished_from_empty_balances() {
    for (chain, body, expected) in [
        (Chain::Solana, json!({"result":null}), StatusCode::NOT_FOUND),
        (
            Chain::Sui,
            json!({"data":{"transaction":null}}),
            StatusCode::NOT_FOUND,
        ),
        (
            Chain::Sui,
            json!({"errors":[{"message":"private detail"}],"data":{}}),
            StatusCode::BAD_GATEWAY,
        ),
        (
            Chain::Zcash,
            json!({"error":{"code":-5,"message":"private detail"}}),
            StatusCode::NOT_FOUND,
        ),
        (
            Chain::Monero,
            json!({"status":"OK","missed_tx":["a".repeat(64)]}),
            StatusCode::NOT_FOUND,
        ),
        (
            Chain::Bitcoin,
            json!({"invalid":true}),
            StatusCode::BAD_GATEWAY,
        ),
    ] {
        let (p, _, task) = start_mock(Mock {
            override_response: Some((StatusCode::OK, body)),
            ..Default::default()
        })
        .await;
        let error = adapters::lookup(chain, "transaction", &"a".repeat(64), &p)
            .await
            .err()
            .unwrap();
        assert_eq!(error.0, expected);
        assert!(!error.1.contains("private detail"));
        task.abort();
    }
}

#[tokio::test]
async fn zcash_unified_validation_and_basic_auth_use_node_contract() {
    let (p, state, task) = mock(false).await;
    let p = Provider::new(
        p.url,
        Some(("fixture-user".into(), "fixture-password".into())),
    );
    let target = format!("u1{}", "q".repeat(200));
    let result = adapters::lookup(Chain::Zcash, "address", &target, &p)
        .await
        .unwrap();
    assert!(result.public_data.contains("isvalid"));
    assert!(!result.public_data.contains("fixture-password"));
    assert!(
        state
            .calls
            .lock()
            .unwrap()
            .iter()
            .any(|(_, v)| v["method"] == "z_listunifiedreceivers" && v["params"][0] == target)
    );
    assert_eq!(
        state.authorizations.lock().unwrap()[0].as_deref(),
        Some("Basic Zml4dHVyZS11c2VyOmZpeHR1cmUtcGFzc3dvcmQ=")
    );
    task.abort();
}

#[tokio::test]
async fn invalid_identifiers_are_rejected_before_any_provider_request() {
    let (p, state, task) = mock(false).await;
    let connections = Connections {
        providers: Chain::ALL.into_iter().map(|c| (c, p.clone())).collect(),
    };
    let response = lookup(
        State(connections.clone()),
        Path(("solana".into(), "address".into(), "bad/path".into())),
    )
    .await
    .into_response();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let response = lookup(
        State(connections),
        Path(("unknown".into(), "address".into(), "0x1".into())),
    )
    .await
    .into_response();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    assert!(state.calls.lock().unwrap().is_empty());
    task.abort();
}
