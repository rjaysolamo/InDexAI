use axum::{Json, extract::Path};
use serde::Serialize;

use crate::{
    labels::resolver::resolve_address,
    models::{address::Address, label::AddressLabel},
};

#[derive(Debug, Serialize)]
pub struct AddressResponse {
    pub address: Address,
    pub label: Option<AddressLabel>,
    pub message: String,
}

pub async fn get_address(Path(address): Path<String>) -> Json<AddressResponse> {
    let label = resolve_address(&address).await.ok().flatten();

    Json(AddressResponse {
        address: Address {
            chain_id: 1,
            address,
            label: label.as_ref().map(|value| value.label.clone()),
        },
        label,
        message: "Address lookup successful.".to_string(),
    })
}
