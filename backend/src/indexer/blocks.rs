use anyhow::{Result, bail};

pub async fn index_block(block_number: u64) -> Result<u64> {
    if block_number == 0 {
        bail!("block number must be greater than zero");
    }

    Ok(block_number)
}
