import { useEffect, useState } from "react";
import {
  getErrorMessage,
  getTransactions,
  type Transaction,
  type PaginatorMeta,
} from "../services/api";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { value: "", label: "Все типы" },
  { value: "credit", label: "Доход" },
  { value: "debit", label: "Расход" },
  { value: "transfer", label: "Перевод" },
];

const TYPE_BADGE: Record<string, string> = {
  credit: "bg-[var(--accent-soft)] text-[var(--accent)]",
  debit: "bg-[var(--surface-3)] text-[var(--text-3)]",
  transfer: "bg-[var(--info-soft)] text-[var(--info-text)]",
};

const TYPE_LABEL: Record<string, string> = {
  credit: "Доход",
  debit: "Расход",
  transfer: "Перевод",
};

const fmtMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

interface Filters {
  category: string;
  type: string;
  date_from: string;
  date_to: string;
  amount_min: string;
  amount_max: string;
}

const EMPTY_FILTERS: Filters = {
  category: "",
  type: "",
  date_from: "",
  date_to: "",
  amount_min: "",
  amount_max: "",
};

export default function TransactionsTable({
  statementId,
  refreshKey = 0,
}: {
  statementId: number | null;
  refreshKey?: number;
}) {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginatorMeta | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Поиск с дебаунсом, остальные фильтры применяются сразу.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Уникальные категории — отдельным запросом (до 100 записей).
  useEffect(() => {
    if (statementId == null) return;
    let cancelled = false;
    getTransactions(statementId, { per_page: 100 })
      .then((res) => {
        if (cancelled) return;
        const uniq = Array.from(
          new Set(res.data.map((t) => t.category).filter((c): c is string => !!c)),
        ).sort();
        setCategories(uniq);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [statementId]);

  useEffect(() => {
    if (statementId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTransactions(statementId, {
      category: filters.category || undefined,
      type: filters.type || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      amount_min: filters.amount_min ? Number(filters.amount_min) : undefined,
      amount_max: filters.amount_max ? Number(filters.amount_max) : undefined,
      search: search || undefined,
      page,
      per_page: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setMeta(res.meta);
      })
      .catch((e) => {
        if (!cancelled) setError(getErrorMessage(e, "Ошибка загрузки транзакций"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statementId, filters, search, page, refreshKey]);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  if (statementId == null) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] backdrop-blur-2xl">
        <h2 className="text-base font-semibold text-[var(--text)]">Транзакции</h2>
        <p className="mt-2 text-sm text-[var(--text-4)]">Выберите выписку, чтобы увидеть транзакции</p>
      </div>
    );
  }

  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] backdrop-blur-2xl">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-[var(--text)]">Транзакции</h2>
        {meta && <span className="text-base text-[var(--text-3)]">всего {meta.total}</span>}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <select
          value={filters.category}
          onChange={(e) => setFilter("category", e.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm"
        >
          <option value="" className="bg-[var(--field)] text-[var(--text)]">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c} className="bg-[var(--field)] text-[var(--text)]">
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilter("type", e.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[var(--field)] text-[var(--text)]">
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilter("date_from", e.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilter("date_to", e.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Сумма от"
          value={filters.amount_min}
          onChange={(e) => setFilter("amount_min", e.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          placeholder="Сумма до"
          value={filters.amount_max}
          onChange={(e) => setFilter("amount_max", e.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm"
        />
        <input
          type="search"
          placeholder="Поиск по описанию…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-3 py-2 text-sm md:col-span-2"
        />
      </div>

      {error && <p className="mb-3 text-sm text-[var(--danger)]">{error}</p>}

      <div className="divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)]">
        {loading && rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-4)]">Загрузка…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-4)]">Ничего не найдено</p>
        ) : (
          rows.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.description ?? "—"}</p>
                <p className="mt-0.5 text-xs text-[var(--text-4)]">
                  {t.date ?? "—"} · {t.category ?? "Без категории"}
                  {t.recipient ? ` · → ${t.recipient}` : ""}
                  {t.merchant ? ` · ${t.merchant}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    TYPE_BADGE[t.type ?? ""] ?? "bg-[var(--surface-3)] text-[var(--text-3)]"
                  }`}
                >
                  {TYPE_LABEL[t.type ?? ""] ?? t.type ?? "—"}
                </span>
                <span
                  className={`w-28 text-right text-sm font-semibold ${
                    t.type === "credit" ? "text-[var(--accent)]" : "text-[var(--text)]"
                  }`}
                >
                  {fmtMoney(t.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {meta && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:bg-[var(--surface-3)] disabled:opacity-30"
          >
            Назад
          </button>
          <span className="text-xs text-[var(--text-3)]">
            {currentPage} из {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-[var(--border-strong)] px-4 py-1.5 text-xs font-medium text-[var(--text-2)] transition hover:bg-[var(--surface-3)] disabled:opacity-30"
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}
