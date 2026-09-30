use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AddressLabel {
    pub address: String,
    pub label: String,
    pub confidence: LabelConfidence,
    pub source: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum LabelConfidence {
    High,
}
