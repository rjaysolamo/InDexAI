use anyhow::{Context, Result};
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub host: [u8; 4],
    pub port: u16,
    pub database_url: String,
    pub rpc_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let _ = dotenvy::dotenv();

        let port = env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .context("PORT must be a valid number")?;

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/indexai".to_string());

        let rpc_url = env::var("RPC_URL")
            .unwrap_or_else(|_| "https://ethereum-rpc.publicnode.com".to_string());

        Ok(Self {
            host: [127, 0, 0, 1],
            port,
            database_url,
            rpc_url,
        })
    }
}
