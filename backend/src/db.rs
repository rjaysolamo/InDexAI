use crate::config::Config;
use anyhow::Result;
use sqlx::postgres::{PgPool, PgPoolOptions};

pub async fn initialize(config: &Config) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    sqlx::query("SELECT 1").execute(&pool).await?;

    println!("Database connection successful.");

    Ok(pool)
}
