# InDexAI frontend

## Run locally

Requires Node.js 20.9+ and a recent stable Rust toolchain (edition 2024).

1. Start PostgreSQL and create the `indexai` database.
2. In `backend`, copy `.env.example` to `.env`, set `DATABASE_URL` and `RPC_URL`, and run `cargo run --locked`.
3. In `frontend`, run `npm ci`, copy `.env.example` to `.env.local`, and run `npm run dev -- --hostname 0.0.0.0`.
4. Open http://localhost:3000. The header reports API reachability; it does not certify the RPC provider or database health.

`API_URL` is the Rust API origin, defaulting to `http://127.0.0.1:8080`. Set it in the **Next.js server** environment in deployments. The older `NEXT_PUBLIC_API_URL` is still accepted as a fallback. Browser requests use `/api/backend/...` on the frontend origin; no browser CORS configuration or publicly exposed backend port is required. Restart Next.js after changing environment variables.

The backend requires PostgreSQL and a reachable RPC provider during startup. Its default public Ethereum RPC supports standard Ethereum methods. **Wallet activity requires an RPC URL supporting `alchemy_getAssetTransfers`**, such as an Ethereum Alchemy endpoint. Without that method, labels still load and activity shows an error. Never put an RPC API key in a `NEXT_PUBLIC_` variable.

## Connected capabilities

| Backend route | Frontend entry point |
| --- | --- |
| `/health` | Live API status in the header (checks every 30 seconds) |
| `/api/v1/addresses/{address}` | Address labels and provenance |
| `/api/v1/addresses/{address}/transactions` | Wallet activity and direction filters |
| `/api/v1/transactions/{hash}` | Transaction details and status |
| `/api/v1/transactions/{hash}/fund-flow` | Transaction fund-flow visualization |
| `/api/v1/transactions/{hash}/logs` | Decoded ERC-20 transfers with raw base-unit amounts |
| `/api/v1/indexer/erc20/{from}/{to}` | Indexer → Scan transfers (inclusive, at most 100 blocks) |
| `/api/v1/blocks/{number}` | Indexer → Validate block |
| `/api/v1/investigations/{target}` | Saved case evidence → Initialize trace |

The backend root `/` is an API identification string, not an investigation operation.

Block requests currently only validate a number. Investigation initialization calls the existing wallet/fund tracing functions, which do not yet produce trace results. These limitations are shown in the UI. Case notebooks, notes, and recent visits remain in browser storage: the backend does not provide case CRUD or persistence endpoints. No server persistence is implied by initializing a trace.

Provider failures return HTTP 502 with a safe error message; invalid scan ranges and zero block requests return HTTP 400. A missing transaction remains a successful lookup with `transaction: null`. Auxiliary failures do not hide successfully loaded transaction details or wallet labels. Requests have deadlines (5 seconds for health, 60 seconds for data; the browser proxy times out after 55 seconds). Reduce the scan range if token metadata lookups take too long.

## Checks

```bash
# frontend
npm run lint
npm run build

# backend
cargo fmt --check
cargo test --locked
```
