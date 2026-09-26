const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

const TOKEN_KEY = "slash-pay.backend.access-token";
const EMAIL_KEY = "slash-pay.backend.email";

export type BackendTransaction = {
  transactionId: string;
  recipientUserId: string | null;
  transactionType: string;
  status: string;
  sourceCurrency: string | null;
  destinationCurrency: string | null;
  sourceAmount: number | null;
  destinationAmount: number | null;
  fxQuoteId: string | null;
  exchangeRate: number | null;
  feeAmount: number | null;
  amount: number | null;
  currency: string | null;
  createdAt: string | null;
  completedAt: string | null;
};

type LoginResponse = { accessToken: string; tokenType: string };
type TransactionHistoryResponse = { content: BackendTransaction[] };

export type BackendRecipient = {
  recipientUserId: string;
  name: string;
  email: string;
  country: string;
  createdAt: string;
};

export type BackendWallet = {
  id: string;
  currency: string;
  balance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendOperationReceipt = {
  transactionId: string;
  currency: string;
  amount: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export function isBackendConfigured() {
  return Boolean(API_BASE_URL);
}

export function getBackendToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getBackendEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(EMAIL_KEY) ?? "";
}

export function clearBackendSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EMAIL_KEY);
}

function saveBackendSession(accessToken: string, email: string) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(EMAIL_KEY, email);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error("The local API is not configured. Set VITE_API_BASE_URL first.");
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getBackendToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body && typeof body.message === "string" ? body.message : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

export async function loginWithBackend(email: string, password: string) {
  const response = await request<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveBackendSession(response.accessToken, email);
}

export function registerWithBackend(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
}) {
  return request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getBackendTransactions(options: { page?: number; size?: number; status?: string; from?: string; to?: string } = {}) {
  const params = new URLSearchParams({ page: String(options.page ?? 0), size: String(options.size ?? 100) });
  if (options.status && options.status !== "all") params.set("status", options.status);
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  return request<TransactionHistoryResponse>(`/api/v1/transactions?${params.toString()}`);
}

export function getBackendRecipients() {
  return request<BackendRecipient[]>("/api/v1/recipients");
}

export function createBackendRecipient(email: string) {
  return request<BackendRecipient>("/api/v1/recipients", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function deleteBackendRecipient(recipientUserId: string) {
  return request<void>(`/api/v1/recipients/${recipientUserId}`, { method: "DELETE" });
}

export type BackendQuote = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  sourceAmount: number;
  exchangeRate: number;
  convertedAmount: number;
  feeAmount: number;
  status: string;
  expiresAt: string;
};

type BackendTransfer = {
  transactionId: string;
  recipientUserId: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmount: number;
  destinationAmount: number;
  status: string;
  completedAt: string | null;
  createdAt: string;
};

export function createBackendQuote(amount: number, fromCurrency: string, toCurrency: string) {
  return request<BackendQuote>("/api/v1/fx/quotes", {
    method: "POST",
    body: JSON.stringify({ amount, fromCurrency, toCurrency }),
  });
}

export function getBackendQuote(quoteId: string) {
  return request<BackendQuote>(`/api/v1/fx/quotes/${quoteId}`);
}

export function createBackendTransfer(recipientUserId: string, quoteId: string, amount: number) {
  return request<BackendTransfer>("/api/v1/transfers", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ recipientUserId, quoteId, amount }),
  });
}

export function getBackendWallets() {
  return request<BackendWallet[]>("/api/v1/wallets");
}

export function createBackendWallet(currency: string) {
  return request<BackendWallet>("/api/v1/wallets", {
    method: "POST",
    body: JSON.stringify({ currency }),
  });
}

export function createBackendBalanceOperation(
  type: "deposit" | "withdrawal",
  amount: number,
  currency: string,
) {
  return request<BackendOperationReceipt>(`/api/v1/${type === "deposit" ? "deposits" : "withdrawals"}`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ amount, currency }),
  });
}
