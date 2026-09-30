use anyhow::Result;

pub async fn trace_wallet(address: &str, depth: u32) -> Result<()> {
    if address.trim().is_empty() {
        anyhow::bail!("wallet address cannot be empty");
    }

    if depth == 0 {
        anyhow::bail!("trace depth must be greater than zero");
    }

    println!("Tracing wallet {} with depth {}", address, depth);

    Ok(())
}
