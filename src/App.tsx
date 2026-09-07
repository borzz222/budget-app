import { useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  listStatements,
  getAnalytics,
  getErrorMessage,
  analyzeStatement,
  getAiInsights,
  isRecommendation,
  type Statement,
  type AnalyticsResponse,
  type AiInsight,
} from "./services/api";
import {
  mapCategories,
  mapRecipients,
  mapTimeline,
  mapTotals,
} from "./services/mappers";
import UploadForm from "./components/UploadForm";
import StatementSelector from "./components/StatementSelector";
import TransactionsTable from "./components/TransactionsTable";
import SavingsPlanner from "./components/SavingsPlanner";
import ReceiptUploader from "./components/ReceiptUploader";
import ManualTransactionForm from "./components/ManualTransactionForm";
import FinancialChatWidget from "./components/FinancialChatWidget";
import { Toaster, toast } from "./components/Toast";

/* ---------------- МОК-ДАННЫЕ ---------------- */

// Мастер-флаг legacy-виджетов исходного шаблона (split-бюджет соседей).
// false — блоки не рендерятся вообще, но код остаётся для отката.
const SHOW_LEGACY_WIDGETS = false;

const ME = "Ты";

const members = [
  { id: "me", name: "Ты", color: "#3FC8A0" },
  { id: "anya", name: "Аня", color: "#A8CF38" },
  { id: "dima", name: "Дима", color: "#B54FB5" },
  { id: "sonya", name: "Соня", color: "#9BA3AE" },
];

const settlements = [
  { from: "Ты", to: "Аня", amount: 1340 },
  { from: "Дима", to: "Ты", amount: 800 },
  { from: "Соня", to: "Аня", amount: 450 },
];

const myBalance = -540;

const budgetTotal = 78000;
const budgetSpent = 71590;

const goal = {
  name: "Новый диван в гостиную",
  target: 45000,
  saved: 28400,
  deadline: "к 15 октября",
};
/* ---------------- МЕЛКИЕ КОМПОНЕНТЫ ---------------- */

const money = (n: number) => n.toLocaleString("ru-RU") + " ₽";

// Короткая подпись даты для оси X ("1 сен" вместо "2026-09-01").
// Не-ISO значения (на всякий случай) отдаём как есть.
const shortDate = (value: string | number) => {
  if (typeof value !== "string") return String(value);
  const dt = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return value;
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "short" }).format(dt);
};

// Шаг подписей оси X: не больше ~7 подписей при любом количестве точек
// (при 5-7 точках — все подряд, при 30+ — каждая 5-я).
const xTickInterval = (length: number) =>
  length <= 7 ? 0 : Math.ceil(length / 7) - 1;

/* Цветовые акценты типов инсайтов и приоритетов рекомендаций. */
const INSIGHT_ACCENT: Record<string, { dot: string; text: string }> = {
  аномалия: { dot: "bg-orange-500", text: "text-orange-700" },
  подписка: { dot: "bg-sky-500", text: "text-sky-700" },
  рост_расходов: { dot: "bg-red-500", text: "text-red-600" },
  главная_категория: { dot: "bg-[#21A038]", text: "text-[#1c8c30]" },
  временной_паттерн: { dot: "bg-violet-500", text: "text-violet-700" },
};

const PRIORITY_STYLE: Record<string, { badge: string; amount: string }> = {
  high: { badge: "bg-red-50 text-red-600", amount: "text-red-600" },
  medium: { badge: "bg-amber-50 text-amber-700", amount: "text-neutral-900" },
  low: { badge: "bg-neutral-100 text-neutral-500", amount: "text-neutral-500" },
};
/* ---------------- ЛОГОТИПЫ ---------------- */

// Вариант 1: круг, поделённый на доли
function MarkPie() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M12 2.5A9.5 9.5 0 0 1 21.5 12H12z" fill="white" />
      <path d="M12 12h9.5A9.5 9.5 0 0 1 12 21.5z" fill="white" opacity="0.75" />
      <path d="M12 12v9.5A9.5 9.5 0 0 1 2.5 12z" fill="white" opacity="0.5" />
      <path d="M12 12H2.5A9.5 9.5 0 0 1 12 2.5z" fill="white" opacity="0.3" />
    </svg>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#21A038]">
        <MarkPie />
      </div>
      <div>
        <p className="text-lg font-semibold leading-tight tracking-tight">СберПоровну</p>
        <p className="text-xs leading-tight text-neutral-400">
          Прототип для экосистемы Сбера
        </p>
      </div>
    </div>
  );
}

function Badge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
        стабильно
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        up ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  dark = false,
}: {
  label: string;
  value: string;
  hint?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 rounded-3xl px-5 py-4 ${
        dark ? "bg-[#0F3D2E] text-white" : "bg-white text-neutral-900"
      }`}
    >
      <div>
        <p className={`text-base ${dark ? "text-white/80" : "text-neutral-600"}`}>{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </div>
      {hint && (
        <p className={`text-base ${dark ? "text-white/70" : "text-neutral-500"}`}>{hint}</p>
      )}
    </div>
  );
}

function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl bg-white p-6 ${className}`}>
      {title && (
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          {action && <span className="text-base text-neutral-500">{action}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------------- ЭКРАН ---------------- */

export default function App() {
    const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [card, setCard] = useState<{ name: string; balance: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickAvatar(id: string) {
    setEditing(id);
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = () => setAvatars((p) => ({ ...p, [editing]: reader.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /* ---- Данные backend FinBalance ---- */
  const [statements, setStatements] = useState<Statement[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  // Анализ реально запускался (сохранённые данные могли прийти пустыми
  // или без наблюдений — это НЕ то же самое, что "не проводился").
  const [aiRan, setAiRan] = useState(false);
  // Счётчик инвалидации после confirm чека: аналитика и таблица
  // перезапрашиваются, т.к. состав транзакций выписки изменился.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listStatements()
      .then((res) => {
        if (cancelled) return;
        setStatements(res.data);
        setCurrentId(res.data.length > 0 ? res.data[0].id : null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const text = getErrorMessage(e, "Не удалось загрузить выписки");
          setApiError(text);
          toast.error(text);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentId == null) return;
    let cancelled = false;
    setLoading(true);
    getAnalytics(currentId)
      .then((res) => {
        if (!cancelled) setAnalytics(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const text = getErrorMessage(e, "Не удалось загрузить аналитику");
          setApiError(text);
          toast.error(text);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentId, refreshKey]);

  // Сохранённый AI-анализ подгружаем тихо, без force=true:
  // платный вызов к GigaChat — только по явному клику пользователя.
  useEffect(() => {
    if (currentId == null) return;
    let cancelled = false;
    setAiLoaded(false);
    setAiInsights([]);
    setAiRan(false);
    getAiInsights(currentId)
      .then((res) => {
        if (!cancelled) {
          setAiInsights(res.data);
          setAiLoaded(true);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          toast.error(getErrorMessage(e, "Не удалось загрузить AI-анализ"));
          setAiLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  async function runAnalysis() {
    if (currentId == null || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await analyzeStatement(currentId, true);
      setAiInsights(res.data);
      setAiRan(true);
      toast.success("Финансовый анализ готов");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось выполнить анализ"));
    } finally {
      setAiLoading(false);
    }
  }

  function handleUploaded(statement: Statement) {
    setStatements((prev) =>
      prev.some((s) => s.id === statement.id) ? prev : [statement, ...prev],
    );
    setCurrentId(statement.id);
  }

  function handleConfirmed() {
    setRefreshKey((k) => k + 1);
  }

  const stats = analytics ? mapTotals(analytics.totals) : null;
  const chartCategories = analytics ? mapCategories(analytics.by_category) : [];
  const chartWeekly = analytics ? mapTimeline(analytics.timeline) : [];
  const recipientSlices = analytics ? mapRecipients(analytics.top_recipients) : [];
  const currentStatement = statements.find((s) => s.id === currentId) ?? null;
  const observations = aiInsights.filter((x) => !isRecommendation(x));
  const recommendations = aiInsights.filter(isRecommendation);
  const totalMonthlySaving = recommendations.reduce((s, r) => s + r.data.monthly_saving, 0);

  const daysLeft = 17;
  const forecastDate = "21 сентября";

  return (
    <div className="min-h-screen bg-[#EFEEEA] px-4 py-5 font-sans text-neutral-900 md:px-8 md:py-7">
      <Toaster />
      <FinancialChatWidget />
            <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      <header className="mb-6 flex flex-col gap-4 md:mb-7 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <div>
            <h1 className="text-lg font-medium tracking-tight text-neutral-700">
              Квартира на Мира, 19
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">Сентябрь · 4 участника</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-neutral-500">
                {myBalance < 0 ? "Ты должен" : "Тебе должны"}
              </p>
              <p
                className={`text-xl font-semibold tracking-tight ${
                  myBalance < 0 ? "text-red-600" : "text-[#1c8c30]"
                }`}
              >
                {money(Math.abs(myBalance))}
              </p>
            </div>
            {SHOW_LEGACY_WIDGETS && (
              <div className="flex -space-x-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    title={`${m.name} — сменить аватар`}
                    onClick={() => pickAvatar(m.id)}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#EFEEEA] bg-cover bg-center text-xs font-semibold text-white transition hover:scale-110"
                    style={
                      avatars[m.id]
                        ? { backgroundImage: `url(${avatars[m.id]})` }
                        : { background: m.color }
                    }
                  >
                    {!avatars[m.id] && m.name[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {SHOW_LEGACY_WIDGETS &&
              (card ? (
                <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-[#21A038]" />
                  <div className="text-left">
                    <p className="text-xs leading-tight text-neutral-400">{card.name}</p>
                    <p className="text-sm font-semibold leading-tight">{money(card.balance)}</p>
                  </div>
                  <button
                    onClick={() => setCard(null)}
                    className="ml-1 text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    отвязать
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCard({ name: "СберКарта •••• 4417", balance: 42300 })}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-white"
                >
                  Привязать карту
                </button>
              ))}
            <button
              disabled
              className="cursor-not-allowed rounded-full bg-[#21A038] px-5 py-2.5 text-sm font-medium text-white opacity-50"
            >
              Добавить трату
            </button>
          </div>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-1 gap-4 md:gap-5 lg:mb-5 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6">
          <UploadForm onUploaded={handleUploaded} />
          <ReceiptUploader statementId={currentId} onConfirmed={handleConfirmed} />
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <ManualTransactionForm statementId={currentId} onSaved={handleConfirmed} />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6">
          <StatementSelector
            statements={statements}
            currentId={currentId}
            onSelect={setCurrentId}
          />
          {loading && <p className="mt-3 text-sm text-neutral-400">Загрузка данных…</p>}
          {apiError && <p className="mt-3 text-sm text-red-600">{apiError}</p>}
          {currentStatement && (
            <p className="mt-3 text-xs text-neutral-400">
              {currentStatement.transactions_count} операций
              {currentStatement.period_from && currentStatement.period_to
                ? ` · ${currentStatement.period_from} — ${currentStatement.period_to}`
                : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:gap-5 lg:mb-5 lg:grid-cols-3">
        <Stat
          label="Баланс выписки"
          value={stats ? money(stats.balance) : "—"}
          hint={currentStatement ? currentStatement.file_name : "нет данных"}
        />
        <Stat label="Доходы" value={stats ? money(stats.income) : "—"} hint="за период" />
        <Stat
          label="Расходы"
          value={stats ? money(stats.expenses) : "—"}
          hint={stats ? `${stats.transactionsCount} операций` : "нет данных"}
          dark
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
        <div className="space-y-4 md:space-y-5 lg:col-span-2">
          {SHOW_LEGACY_WIDGETS && (
            <Card title="Кто кому должен" action="минимум переводов">
            <div className="space-y-3">
              {settlements.map((s, i) => {
                const mine = s.from === ME || s.to === ME;
                return (
                  <div
                    key={i}
                    className={`flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      mine ? "bg-[#F1F8F3]" : "bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{s.from}</span>
                      <svg width="28" height="8" viewBox="0 0 28 8" fill="none">
                        <path d="M0 4h24m0 0-4-3.5M24 4l-4 3.5" stroke="#21A038" strokeWidth="1.5" />
                      </svg>
                      <span className="text-sm font-medium">{s.to}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-semibold ${
                          s.from === ME
                            ? "text-red-600"
                            : s.to === ME
                            ? "text-[#1c8c30]"
                            : "text-neutral-500"
                        }`}
                      >
                        {money(s.amount)}
                      </span>
                      {s.from === ME ? (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-full bg-[#21A038] px-4 py-1.5 text-xs font-medium text-white opacity-50"
                        >
                          Перевести по СБП
                        </button>
                      ) : s.to === ME ? (
                        <button
                          disabled
                          className="cursor-not-allowed rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-700 opacity-50"
                        >
                          Напомнить
                        </button>
                      ) : (
                        <span className="w-[92px]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </Card>
          )}

          <Card
            title="Траты по дням"
            action={currentStatement ? currentStatement.file_name : "нет данных"}
          >
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartWeekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#21A038" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#21A038" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={shortDate}
                    interval={xTickInterval(chartWeekly.length)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={(v) => v / 1000 + "к"}
                  />
                  <Tooltip
                    formatter={(v) => [money(Number(v ?? 0)), "Потрачено"]}
                    contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="sum" stroke="#21A038" strokeWidth={2.5} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <TransactionsTable statementId={currentId} refreshKey={refreshKey} />

<Card
            title="Расходы по категориям"
            action={currentStatement ? currentStatement.file_name : "нет данных"}
          >
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCategories} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={92}
                    interval={0}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <Tooltip
                    formatter={(v) => [money(Number(v ?? 0)), "Сумма"]}
                    contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                  />
                  <Bar dataKey="sum" radius={[0, 6, 6, 0]} barSize={14}>
                    {chartCategories.map((c, i) => (
                      <Cell key={i} fill={c.trend > 50 ? "#21A038" : "#CBE7D3"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 divide-y divide-neutral-100 border-t border-neutral-300">
              {chartCategories.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-neutral-600">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{money(c.sum)}</span>
                    <Badge value={c.trend} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {SHOW_LEGACY_WIDGETS && (
            <div className="rounded-3xl bg-[#0F3D2E] p-6 text-white">
            <p className="text-sm text-white/70">Бюджет закончится</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{forecastDate}</p>
            <p className="mt-1 text-sm text-white/60">на 9 дней раньше плана</p>

            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#4CAF6D]"
                style={{ width: `${(budgetSpent / budgetTotal) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/60">
              <span>{money(budgetSpent)}</span>
              <span>из {money(budgetTotal)}</span>
            </div>

            <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-relaxed text-white/80">
              Средний расход за последние 14 дней — 2 480 ₽ в день. При таком темпе остатка хватит
              на {daysLeft} дней, с учётом подписок 15-го числа.
            </p>
            </div>
          )}
          {SHOW_LEGACY_WIDGETS && (
          <Card title="Общая цель" action={goal.deadline}>
            <p className="text-sm font-medium">{goal.name}</p>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-semibold tracking-tight">{money(goal.saved)}</p>
              <p className="text-2xl font-semibold tracking-tight text-neutral-400">
                из {money(goal.target)}
              </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[#21A038]"
                style={{ width: `${(goal.saved / goal.target) * 100}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Осталось {money(goal.target - goal.saved)} — это по{" "}
              {money(Math.round((goal.target - goal.saved) / 4))} с каждого.
            </p>
            <button
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-full bg-[#21A038] py-2.5 text-sm font-medium text-white opacity-50"
            >
              Внести взнос
            </button>
          </Card>
          )}
          <Card
            title="Топ получателей"
            action={currentStatement ? currentStatement.file_name : "нет данных"}
          >
            <div className="flex items-center gap-4">
              <div className="relative h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={recipientSlices} dataKey="sum" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={2}>
                      {recipientSlices.map((m, i) => (
                        <Cell key={i} fill={m.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => money(Number(v ?? 0))}
                      contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-semibold tracking-tight">
                    {(() => {
                      const total = recipientSlices.reduce((s, m) => s + m.sum, 0);
                      if (total <= 0 || recipientSlices.length === 0) return "—";
                      return `${Math.round((recipientSlices[0].sum / total) * 100)}%`;
                    })()}
                  </p>
                  <p className="text-[10px] text-neutral-400">топ-1 доля</p>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {recipientSlices.length === 0 && (
                  <p className="text-sm text-neutral-400">Получателей нет</p>
                )}
                {recipientSlices.map((m) => {
                  const total = recipientSlices.reduce((s, x) => s + x.sum, 0);
                  const pct = total > 0 ? Math.round((m.sum / total) * 100) : 0;
                  return (
                    <div key={m.name} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                        <span className="truncate text-neutral-600">{m.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-medium">{money(m.sum)}</span>
                        <span className="w-8 text-right text-xs text-neutral-400">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card title="Что заметил ассистент">
  <div className="space-y-3">
    {!aiLoaded || aiLoading ? (
      <p className="py-2 text-center text-sm text-neutral-400">
        {aiLoading ? "Анализируем ваши финансы…" : "Загрузка…"}
      </p>
    ) : observations.length === 0 ? (
      <div>
        {aiInsights.length === 0 && !aiRan ? (
          <>
            <p className="mb-3 text-sm leading-relaxed text-neutral-500">
              Анализ для этой выписки ещё не проводился.
            </p>
            <button
              onClick={runAnalysis}
              disabled={currentId == null}
              className="w-full rounded-full bg-[#21A038] py-2.5 text-sm font-medium text-white transition hover:bg-[#1c8c30] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Провести финансовый анализ
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm leading-relaxed text-neutral-500">
              Наблюдений по этой выписке нет.
            </p>
            <button
              onClick={runAnalysis}
              className="w-full rounded-full border border-neutral-200 py-2 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50"
            >
              Обновить анализ
            </button>
          </>
        )}
      </div>
    ) : (
      <>
        {observations.map((o) => {
          const accent = INSIGHT_ACCENT[o.type] ?? {
            dot: "bg-neutral-400",
            text: "text-neutral-600",
          };
          return (
            <div key={o.id} className="rounded-2xl bg-neutral-50 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
                <p className={`text-sm font-semibold ${accent.text}`}>{o.title}</p>
              </div>
              <p className="text-sm leading-relaxed text-neutral-700">{o.description}</p>
            </div>
          );
        })}
        <button
          onClick={runAnalysis}
          className="w-full rounded-full border border-neutral-200 py-2 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50"
        >
          Обновить анализ
        </button>
      </>
    )}
  </div>
</Card>

<Card
  title="Как сэкономить"
  action={
    recommendations.length > 0 ? `≈ ${money(totalMonthlySaving)} / мес` : undefined
  }
>
  <div className="space-y-3">
    {!aiLoaded || aiLoading ? (
      <p className="py-2 text-center text-sm text-neutral-400">
        {aiLoading ? "Анализируем ваши финансы…" : "Загрузка…"}
      </p>
    ) : recommendations.length === 0 ? (
      <p className="py-2 text-sm leading-relaxed text-neutral-500">
        Рекомендаций пока нет
      </p>
    ) : (
      recommendations.map((r) => {
        const style = PRIORITY_STYLE[r.data.priority] ?? PRIORITY_STYLE.low;
        return (
          <div key={r.id} className="rounded-2xl bg-[#F1F8F3] p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">{r.title}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
              >
                {r.data.priority}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-600">{r.description}</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-700">
              {r.data.recommendation}
            </p>
            <p className={`mt-1.5 text-sm font-semibold ${style.amount}`}>
              ≈ {money(r.data.monthly_saving)} / месяц · ≈ {money(r.data.annual_saving)} / год
            </p>
          </div>
        );
      })
    )}
  </div>
</Card>
          <SavingsPlanner statementId={currentId} />
        </div>
      </div>
    </div>
  );
}