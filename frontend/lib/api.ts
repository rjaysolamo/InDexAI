import { backendUrl } from "./backend";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, timeout = 60000): Promise<T> {
  const base = typeof window === "undefined" ? backendUrl() : "/api/backend";
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new ApiError(
      "The data service could not be reached. Please try again.",
      503,
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(
      typeof error?.message === "string"
        ? error.message
        : `Request failed (${response.status}).`,
      response.status,
    );
  }
  if (path === "/health") return (await response.text()) as T;
  return response.json();
}

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
  return request(`/api/v1/addresses/${encodeURIComponent(address)}`);
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
  return request(
    `/api/v1/transactions/${encodeURIComponent(txHash)}/fund-flow`,
  );
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
  return request(
    `/api/v1/addresses/${encodeURIComponent(address)}/transactions`,
  );
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
  return request(`/api/v1/transactions/${encodeURIComponent(hash)}`);
}

export type TokenTransfer = {
  chain_id: number;
  tx_hash: string;
  token_address: string;
  from_address: string;
  to_address: string;
  amount: string;
  log_index: number;
};
export type LogsResponse = {
  transaction_hash: string;
  transfers: TokenTransfer[];
  message: string;
};
export type Erc20Transfer = Omit<TokenTransfer, "chain_id" | "tx_hash"> & {
  transaction_hash: string;
  block_number: number;
  symbol: string;
  decimals: number;
  human_amount: string;
};
export type ScanResponse = {
  from_block: number;
  to_block: number;
  transfers: Erc20Transfer[];
  message: string;
};
export type BlockResponse = { block_number: number; message: string };
export type InvestigationResponse = {
  id: string;
  target: string;
  depth: number;
  message: string;
};
export const getHealth = () => request<string>("/health", 5000);
export const getLogs = (hash: string) =>
  request<LogsResponse>(
    `/api/v1/transactions/${encodeURIComponent(hash)}/logs`,
  );
export const getBlock = (block: number) =>
  request<BlockResponse>(`/api/v1/blocks/${block}`);
export const getInvestigation = (target: string) =>
  request<InvestigationResponse>(
    `/api/v1/investigations/${encodeURIComponent(target)}`,
  );
export const scanErc20 = (from: number, to: number) =>
  request<ScanResponse>(`/api/v1/indexer/erc20/${from}/${to}`);
