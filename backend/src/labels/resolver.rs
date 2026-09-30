use anyhow::Result;

use crate::models::label::{AddressLabel, LabelConfidence};

pub async fn resolve_address(address: &str) -> Result<Option<AddressLabel>> {
    let normalized = address.to_lowercase();

    let label = match normalized.as_str() {
        "0x0000000000000000000000000000000000000000" => Some(make_label(
            &normalized,
            "Zero Address",
            "Ethereum protocol convention",
        )),

        "0x111111125421ca6dc452d289314280a0f8842a65" => Some(make_label(
            &normalized,
            "1inch Aggregation Router",
            "Known Ethereum contract address",
        )),

        "0x111116053f09d34a7eae8102887004445176ca11" => Some(make_label(
            &normalized,
            "1inch Router",
            "Known Ethereum contract address",
        )),

        "0x000000000004444c5dc75cb358380d2e3de08a90" => Some(make_label(
            &normalized,
            "Uniswap Universal Router",
            "Known Ethereum contract address",
        )),

        _ => None,
    };

    Ok(label)
}

fn make_label(address: &str, label: &str, source: &str) -> AddressLabel {
    AddressLabel {
        address: address.to_string(),
        label: label.to_string(),
        confidence: LabelConfidence::High,
        source: source.to_string(),
    }
}
