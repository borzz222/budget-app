/* Тонкий fetch-клиент backend FinBalance (Laravel).
 * Интерфейсы повторяют структуры backend 1-в-1, без адаптации под UI.
 * Адаптация под shape компонентов — в services/mappers.ts.
 */

export const API_BASE = "http://127.0.0.1:8000/api";

export interface Statement {
  id: number;
  file_name: string;
  file_type: string;
  period_from: string | null;
  period_to: string | null;
  transactions_count: number;
  created_at: string | null;
}

export interface PaginatorMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StatementListResponse {
  data: Statement[];
  meta: PaginatorMeta;
}

export interface UploadResponse {
  data: Statement;
  imported_transactions_count: number;
}

export interface AnalyticsTotals {
  total_income: number;
  total_expenses: number;
  balance: number;
  average_expense: number;
  transactions_count: number;
}

export interface CategorySlice {
  category: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

export interface TimelinePoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface RecipientSlice {
  recipient: string;
  amount: number;
  transactions_count: number;
}

export interface LargestTransaction {
  amount: number;
  description: string | null;
  date: string | null;
  category: string | null;
}

export interface AnalyticsExtras {
  weekend_spending: number;
  weekday_spending: number;
  average_daily_spending: number;
  largest_transaction: LargestTransaction | null;
}

export interface AnalyticsResponse {
  totals: AnalyticsTotals;
  by_category: CategorySlice[];
  timeline: TimelinePoint[];
  top_recipients: RecipientSlice[];
  extras: AnalyticsExtras;
}

export type TransactionType = "credit" | "debit" | "transfer" | string;

export interface Transaction {
  id: number;
  date: string | null;
  amount: number;
  type: TransactionType | null;
  description: string | null;
  merchant: string | null;
  recipient: string | null;
  category: string | null;
  category_confidence: number | null;
}

export type TransactionFilters = {
  category?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  sort?: "asc" | "desc";
  page?: number;
  per_page?: number;
};

export interface TransactionListResponse {
  data: Transaction[];
  meta: PaginatorMeta;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(extractMessage(body) ?? `Ошибка запроса (статус ${status})`);
    this.status = status;
    this.body = body;
  }
}

/* Достаём человекочитаемый текст из тела ошибки backend:
 * 1) errors.* — первое сообщение валидации Laravel (у нас на русском);
 * 2) message — текст доменной ошибки backend (тоже на русском);
 * 3) иначе null — caller подставит fallback. */
function extractMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  const errors = record.errors;
  if (typeof errors === "object" && errors !== null) {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      if (typeof value === "string") return value;
    }
  }

  if (typeof record.message === "string" && record.message !== "") {
    return record.message;
  }

  return null;
}

/* Единая точка получения текста ошибки для UI: осмысленный message
 * из ApiError, иначе — переданный fallback (тоже человекочитаемый). */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && e.message !== "") return e.message;
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(
      0,
      { message: "Не удалось соединиться с сервером. Проверьте, что backend запущен." },
    );
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listStatements(page = 1): Promise<StatementListResponse> {
  return request<StatementListResponse>(`/statements${toQuery({ page })}`);
}

export function uploadStatement(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadResponse>("/statements/upload", {
    method: "POST",
    body: form,
  });
}

export function getAnalytics(id: number): Promise<AnalyticsResponse> {
  return request<AnalyticsResponse>(`/statements/${id}/analytics`);
}

export function getTransactions(
  id: number,
  filters: TransactionFilters = {},
): Promise<TransactionListResponse> {
  return request<TransactionListResponse>(
    `/statements/${id}/transactions${toQuery(filters)}`,
  );
}

export type InsightType =
  | "аномалия"
  | "подписка"
  | "рост_расходов"
  | "главная_категория"
  | "временной_паттерн"
  | "recommendation";

export type RecommendationPriority = "high" | "medium" | "low";

export interface RecommendationData {
  recommendation: string;
  priority: RecommendationPriority;
  category: string;
  reduction_percentage: number;
  monthly_saving: number;
  annual_saving: number;
}

export interface AiInsight {
  id: number;
  type: InsightType | string;
  title: string;
  description: string;
  data: RecommendationData | Record<string, never>;
  potential_saving: number | null;
  created_at: string | null;
}

export interface AiAnalyzeResponse {
  data: AiInsight[];
  from_cache: boolean;
}

export interface AiInsightsResponse {
  data: AiInsight[];
}

export function isRecommendation(
  insight: AiInsight,
): insight is AiInsight & { data: RecommendationData } {
  return insight.type === "recommendation";
}

export function analyzeStatement(id: number, force = false): Promise<AiAnalyzeResponse> {
  return request<AiAnalyzeResponse>(
    `/statements/${id}/ai/analyze${toQuery({ force: force ? "true" : undefined })}`,
    { method: "POST" },
  );
}

export function getAiInsights(id: number): Promise<AiInsightsResponse> {
  return request<AiInsightsResponse>(`/statements/${id}/ai/insights`);
}

export interface PlanDistributionItem {
  category: string;
  current_amount: number;
  reduction_percentage: number;
  monthly_saving: number;
}

export interface SavingsPlanResponse {
  target_monthly_saving: number;
  achievable_monthly_saving: number;
  achievable_annual_saving: number;
  reachable: boolean;
  source: "ai" | "fallback";
  distribution: PlanDistributionItem[];
}

export function requestSavingsPlan(
  id: number,
  targetMonthlySaving: number,
): Promise<SavingsPlanResponse> {
  return request<SavingsPlanResponse>(`/statements/${id}/savings-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ target_monthly_saving: targetMonthlySaving }),
  });
}

export interface ReceiptScanResult {
  date: string;
  merchant: string;
  amount: number;
  suggested_category: string;
  category_confidence: number;
}

export interface ReceiptConfirmData {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

export interface ReceiptConfirmResponse {
  data: Transaction;
  message: string;
}

export function scanReceipt(id: number, file: File): Promise<ReceiptScanResult> {
  const form = new FormData();
  form.append("receipt", file);
  return request<ReceiptScanResult>(`/statements/${id}/receipts/scan`, {
    method: "POST",
    body: form,
  });
}

export function confirmReceipt(
  id: number,
  data: ReceiptConfirmData,
): Promise<ReceiptConfirmResponse> {
  return request<ReceiptConfirmResponse>(`/statements/${id}/receipts/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message, history }),
  });
}

export interface CategoriesResponse {
  expense: string[];
  income: string[];
}

export function getCategories(): Promise<CategoriesResponse> {
  return request<CategoriesResponse>("/categories");
}

export interface ManualTransactionData {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "debit" | "credit";
}

export function createManualTransaction(
  id: number,
  data: ManualTransactionData,
): Promise<ReceiptConfirmResponse> {
  return request<ReceiptConfirmResponse>(`/statements/${id}/transactions/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
}
