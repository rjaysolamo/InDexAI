# InDexAI

**InDexAI** is a blockchain investigation and indexing tool focused on helping investigators follow the movement of funds on-chain.

It is designed to go beyond a traditional blockchain explorer by organizing blockchain data around investigations, fund flows, wallet activity, token movements, and address intelligence.

> **Follow the money on-chain.**

## Table of Contents

* [About](#about)
* [What InDexAI Does](#what-indexai-does)
* [Current Capabilities](#current-capabilities)
* [Investigation Focus](#investigation-focus)
* [Supported Blockchain Data](#supported-blockchain-data)
* [Development Direction](#development-direction)
* [Project Status](#project-status)

## About

Blockchain explorers are useful for viewing individual transactions, but blockchain investigations often require connecting many pieces of information together.

InDexAI aims to make that process easier by turning raw blockchain activity into investigation-friendly data.

The goal is to help answer questions such as:

* Where did the funds come from?
* Where did the funds go?
* Which wallets interacted with each other?
* Which tokens moved?
* What contracts were involved?
* What happened before and after a transaction?
* Can a fund movement be followed across multiple transactions or chains?

## What InDexAI Does

InDexAI focuses on collecting and processing blockchain data that can be useful during an investigation.

The system is being developed around:

* Wallet investigation
* Transaction analysis
* Token transfer detection
* Fund-flow analysis
* Address identification
* Contract identification
* Blockchain indexing
* Cross-transaction tracing
* Cross-chain investigation
* Investigation reports

## Current Capabilities

Current development includes:

* Ethereum RPC integration
* PostgreSQL database connection
* Transaction lookup
* Transaction receipt lookup
* ERC-20 transfer indexing
* ERC-20 `Transfer` event decoding
* Dynamic ERC-20 token metadata lookup
* Token symbol detection
* Token decimals detection
* Human-readable token amounts
* Fund-flow generation
* Fund-flow nodes and edges
* Basic address labeling
* Metadata caching during fund-flow processing
* REST API endpoints for blockchain investigation data

## Investigation Focus

InDexAI is being built with an investigator-first mindset.

The goal is not simply to display blockchain data, but to make relationships between blockchain events easier to understand.

A transaction should eventually become more than:

```text
Transaction Hash
Block
From
To
Value
```

It should help an investigator understand:

```text
Source
   ↓
Transaction
   ↓
Contract / Wallet
   ↓
Token Movement
   ↓
Destination
```

This approach is intended to make tracing suspicious or relevant fund movements easier to investigate and document.

## Supported Blockchain Data

Ethereum supports the original transaction, ERC-20 transfer and fund-flow investigation views. Additional public-data connections are available for **Solana, Sui, Aptos, Bitcoin, Zcash and Monero** through the frontend chain selector and Chains page.

Coverage differs by chain. Solana, Sui, Aptos and Bitcoin expose native balances and bounded activity. Zcash requires a configured node and provides address validation and public transaction records. Monero exposes public transaction metadata, not address balances or private transfer paths. Shielded/private data is not inferred or decrypted. Non-Ethereum connections do not yet include fund-flow graphs or multi-hop tracing.

See [frontend setup and chain configuration](frontend/README.md) and [backend environment examples](backend/.env.example).

## Development Direction

The development direction is:

**Indexer → Explorer → Investigator → Multi-chain → Intelligence → AI**

The initial priority is reliable blockchain data.

AI-assisted investigation and automated explanations will come later, after the underlying blockchain data and tracing capabilities are reliable enough to support them.

## Project Status

InDexAI is currently under active development.

The project is focused on building the core indexing and investigation capabilities first before adding more advanced intelligence and AI features.

The current implementation is experimental and should not be considered a production-grade forensic platform yet.
