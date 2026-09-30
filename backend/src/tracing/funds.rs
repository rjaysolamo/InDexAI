use anyhow::Result;

pub async fn trace_funds(address: &str, depth: u32, asset: Option<&str>) -> Result<()> {
    if address.trim().is_empty() {
        anyhow::bail!("wallet address cannot be empty");
    }

    if depth == 0 {
        anyhow::bail!("trace depth must be greater than zero");
    }

    println!(
        "Tracing funds from {} with depth {} and asset {:?}",
        address, depth, asset
    );

    Ok(())
}
