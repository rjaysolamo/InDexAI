const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

export type AddressResponse = {
  address: {
    chain_id: number;
    address: string;
    label: string | null;
  };
  label: {
    address: string;
    label: string;
    confidence: string;
    source: string;
  } | null;
  message: string;
};

export async function getAddress(address: string): Promise<AddressResponse> {
  const response = await fetch(`${API_URL}/api/v1/addresses/${address}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Address request failed: ${response.status}`);
  }

  return response.json();
}

export type FundFlowNode = {
  address: string;
  label: string | null;
};

export type FundFlowEdge = {
  from: string;
  to: string;
  token_address: string | null;
  symbol: string;
  decimals: number;
  amount: string;
  human_amount: string;
  log_index: number | null;
};

export type FundFlow = {
  transaction_hash: string;
  transaction_from: string;
  nodes: FundFlowNode[];
  edges: FundFlowEdge[];
};

export type FundFlowResponse = {
  fund_flow: FundFlow | null;
  message: string;
};

export async function getFundFlow(txHash: string): Promise<FundFlowResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/transactions/${txHash}/fund-flow`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    },
  );

  if (!response.ok) {
    throw new Error(`Fund flow request failed: ${response.status}`);
  }

  return response.json();
}

export type AddressTransaction = {
  hash: string;
  block_number: number | null;
  from_address: string;
  to_address: string | null;
  value: string;
  asset: string | null;
  category: string | null;
  direction: string;
};

export type AddressTransactionsResponse = {
  address: string;
  transactions: AddressTransaction[];
  message: string;
};

export async function getAddressTransactions(
  address: string,
): Promise<AddressTransactionsResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/addresses/${address}/transactions`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    },
  );

  if (!response.ok) {
    throw new Error(`Address transactions request failed: ${response.status}`);
  }

  return response.json();
}

export type Transaction = {
  hash: string;
  block_number: number | null;
  from_address: string;
  to_address: string | null;
  value: string;
  gas: string;
  gas_price: string | null;
  status: number | null;
};

export type TransactionResponse = {
  transaction: Transaction | null;
  message: string;
};

export async function getTransaction(
  hash: string,
): Promise<TransactionResponse> {
  const response = await fetch(`${API_URL}/api/v1/transactions/${hash}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`Transaction request failed: ${response.status}`);
  }

  return response.json();
}
