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

## Solana, Sui, Aptos, Bitcoin, Zcash and Monero

Open **Chains** to check each provider connection. Search now has a chain selector; for the new chains, explicitly choose **Address** or **Transaction**. This matters for Aptos, where address and transaction hashes can have the same shape. Detail pages, recent activity and case evidence retain the chain and lookup type. Existing Ethereum bookmarks and browser notebooks remain compatible. Base58 identifiers retain their case.

Configure these variables in **backend/.env**, never in the browser:

| Chain | Variable / protocol | Default | Available lookup data |
| --- | --- | --- | --- |
| Solana | `SOLANA_RPC_URL` / JSON-RPC | `https://api.mainnet-beta.solana.com` | Finalized native SOL balance, 20 recent signatures, parsed transactions up to version 0 |
| Sui | `SUI_GRAPHQL_URL` / GraphQL | `https://graphql.mainnet.sui.io/graphql` | Native SUI balance, 20 recent sent transactions, transaction/effects data |
| Aptos | `APTOS_API_URL` / REST, including `/view` | `https://api.mainnet.aptoslabs.com/v1` | Account information, native APT balance, up to 20 sent transactions and transaction lookup |
| Bitcoin | `BITCOIN_API_URL` / Esplora REST | `https://blockstream.info/api` | Confirmed balance, unconfirmed balance change, first page of address history, transaction inputs/outputs |
| Zcash | `ZCASH_RPC_URL` / zcashd-compatible JSON-RPC | **No default: configure a node** | Transparent/Sprout/Sapling/unified address validation and public transaction data |
| Monero | `MONERO_RPC_URL` / daemon HTTP RPC | `https://xmr-node.cakewallet.com:18081` | Public transaction metadata and daemon height; no public address balance/history |

Defaults use mainnet. The identifier checks accept mainnet formats, not testnet addresses. Keep overrides on the intended network; connection checks report provider reachability and latest position, not independent consensus verification. Public endpoints can rate-limit or prune history. An empty URL disables a connection. Endpoint URLs and credentials are not returned to the browser. Each upstream request has a 12-second deadline. Restart the Rust API after changing environment variables. An unavailable Ethereum RPC at startup no longer prevents the other configured chains from serving requests (PostgreSQL is still required).

For an authenticated Zcash node, also set `ZCASH_RPC_USER` and `ZCASH_RPC_PASSWORD`. Enable `txindex=1` and complete indexing to retrieve historical transactions. Unified addresses use `z_listunifiedreceivers`; transparent addresses use `validateaddress`; Sprout/Sapling use `z_validateaddress`. Only validation results are returned, not wallet ownership metadata from the node. No Zcash node or real credentials are bundled.

Sui uses the current GraphQL API: the public fullnode JSON-RPC service is retired. Bitcoin expects an **Esplora API**, not a Bitcoin Core RPC URL. Monero expects the daemon root URL (without `/json_rpc`); the application uses `/get_info` and `/get_transactions`, never wallet RPC.

### Privacy and coverage

Monero does not publish address balances or address transaction histories. Address searches display that limitation without sending the address to a daemon; only the identifier format is checked, not its checksum. Transaction lookups show publicly available metadata. RingCT zero placeholders are not interpreted as zero transferred value. Zcash shielded sender/recipient/amount information cannot be recovered from public commitments or ciphertext. The application does not request, import or store view keys, spending keys or seed phrases.

These connections provide public lookups. Ethereum ERC-20 scanning, label resolution, fund-flow graphs and trace initialization remain Ethereum-specific. Other chains do not gain those features simply by being connected. Native balances exclude other tokens, and activity is bounded by each provider's first page rather than claimed as complete. Missing activity or balance requests produce coverage notices. Case notebooks still use browser storage and are not synced to a server.

### New API routes

- `GET /api/v1/chains` — configured connections and coverage (no URLs/secrets).
- `GET /api/v1/chains/{chain}/status` — live provider connection and latest position.
- `GET /api/v1/chains/{chain}/{address|transaction}/{identifier}` — normalized public details and bounded activity.

The frontend proxies only the listed read operations. It does not expose a general RPC gateway. Unknown chains/absent data return 404, invalid identifiers return 400, unconfigured providers return 503, and upstream failures return 502. For Zcash, a transaction unavailable from the node's index returns 404 with an indexing hint.

Additional checks (Node 24+ for the native TypeScript test runner):

```bash
npm run test:chains
```

The frontend and Rust tests share `data/chain-targets.json`. Backend tests cover each provider protocol, exact native-unit conversion, missing data, sanitization, private-chain limits, Zcash unified validation and Basic authentication using synthetic fixtures.
