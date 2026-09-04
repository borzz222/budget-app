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

/* ---------------- МОК-ДАННЫЕ ---------------- */

const ME = "Ты";

const members = [
  { id: "me", name: "Ты", color: "#21A038" },
  { id: "anya", name: "Аня", color: "#0F5132" },
  { id: "dima", name: "Дима", color: "#4CAF6D" },
  { id: "sonya", name: "Соня", color: "#A3D9B1" },
];

const settlements = [
  { from: "Ты", to: "Аня", amount: 1340 },
  { from: "Дима", to: "Ты", amount: 800 },
  { from: "Соня", to: "Аня", amount: 450 },
];

const myBalance = -540;

const weekly = [
  { week: "7 июл", sum: 11200 },
  { week: "14 июл", sum: 9800 },
  { week: "21 июл", sum: 13400 },
  { week: "28 июл", sum: 10100 },
  { week: "4 авг", sum: 12600 },
  { week: "11 авг", sum: 11900 },
  { week: "18 авг", sum: 16800 },
  { week: "25 авг", sum: 19400 },
];

const categories = [
  { name: "Аренда", sum: 32000, trend: 0 },
  { name: "Продукты", sum: 18400, trend: 4 },
  { name: "Доставка", sum: 6800, trend: 180 },
  { name: "Развлечения", sum: 5600, trend: -12 },
  { name: "Коммуналка", sum: 4200, trend: 6 },
  { name: "Транспорт", sum: 3100, trend: -3 },
  { name: "Подписки", sum: 1490, trend: 0 },
];

const byMember = [
  { name: "Аня", sum: 38200, color: "#0F5132" },
  { name: "Ты", sum: 17898, color: "#21A038" },
  { name: "Дима", sum: 9600, color: "#4CAF6D" },
  { name: "Соня", sum: 5892, color: "#A3D9B1" },
];

const transactions = [
  { who: "Аня", what: "Продукты, Пятёрочка", amount: 4230, when: "Сегодня, 14:12", split: 4 },
  { who: "Ты", what: "Интернет за сентябрь", amount: 900, when: "Сегодня, 11:40", split: 4 },
  { who: "Дима", what: "Доставка, вечер", amount: 1870, when: "Вчера, 22:05", split: 2 },
  { who: "Соня", what: "Бытовая химия", amount: 1120, when: "Вчера, 19:31", split: 4 },
  { who: "Аня", what: "Аренда, сентябрь", amount: 32000, when: "1 сентября", split: 4 },
];

const budgetTotal = 78000;
const budgetSpent = 71590;

/* ---------------- МЕЛКИЕ КОМПОНЕНТЫ ---------------- */

const money = (n: number) => n.toLocaleString("ru-RU") + " ₽";

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
      className={`rounded-3xl p-5 ${
        dark ? "bg-[#0F3D2E] text-white" : "bg-white text-neutral-900"
      }`}
    >
      <p className={`text-sm ${dark ? "text-white/70" : "text-neutral-500"}`}>{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && (
        <p className={`mt-1 text-xs ${dark ? "text-white/60" : "text-neutral-400"}`}>{hint}</p>
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
          {action && <span className="text-xs text-neutral-400">{action}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------------- ЭКРАН ---------------- */

export default function App() {
  const daysLeft = 17;
  const forecastDate = "21 сентября";

  return (
    <div className="min-h-screen bg-[#EFEEEA] px-8 py-7 font-sans text-neutral-900">
      <header className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Квартира на Мира, 19</h1>
          <p className="mt-1 text-sm text-neutral-500">Сентябрь · 4 участника</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#EFEEEA] text-xs font-semibold text-white"
                style={{ background: m.color }}
              >
                {m.name[0]}
              </div>
            ))}
          </div>
          <button className="rounded-full bg-[#21A038] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c8c30]">
            Добавить трату
          </button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-4 gap-5">
        <Stat label="Общие траты в сентябре" value={money(71590)} hint="за 4 дня" />
        <Stat label="Твоя доля" value={money(17898)} hint="25% от общих" />
        <Stat label="Незакрытых долгов" value="3" hint="на сумму 2 590 ₽" />
        <Stat
          label={myBalance < 0 ? "Ты должен" : "Тебе должны"}
          value={money(Math.abs(myBalance))}
          hint="итог по всем участникам"
          dark
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card title="Кто кому должен" action="минимум переводов">
            <div className="space-y-3">
              {settlements.map((s, i) => {
                const mine = s.from === ME || s.to === ME;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
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
                      <span className="text-sm font-semibold">{money(s.amount)}</span>
                      {s.from === ME ? (
                        <button className="rounded-full bg-[#21A038] px-4 py-1.5 text-xs font-medium text-white">
                          Перевести
                        </button>
                      ) : s.to === ME ? (
                        <button className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-700">
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

          <Card title="Общие траты по неделям" action="последние 8 недель">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickFormatter={(v) => v / 1000 + "к"}
                  />
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="sum" stroke="#21A038" strokeWidth={2.5} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Последние траты" action="показать все">
            <div className="divide-y divide-neutral-100">
              {transactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: members.find((m) => m.name === t.who)?.color ?? "#999" }}
                    >
                      {t.who[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.what}</p>
                      <p className="text-xs text-neutral-400">
                        {t.who} · {t.when} · на {t.split} чел.
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{money(t.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
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

          <Card title="Кто сколько внёс" action="сентябрь">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byMember} dataKey="sum" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {byMember.map((m, i) => (
                      <Cell key={i} fill={m.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {byMember.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                    <span className="text-neutral-600">{m.name}</span>
                  </div>
                  <span className="font-medium">{money(m.sum)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Что заметил ассистент">
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#F1F8F3] p-4">
                <p className="text-sm leading-relaxed">
                  Доставка выросла в 2,8 раза за две недели — 6 800 ₽ против средних 2 400 ₽. Почти
                  всё по будням после 21:00.
                </p>
                <p className="mt-2 text-sm font-medium text-[#1c8c30]">
                  Два домашних ужина в неделю вернут около 3 000 ₽ в месяц.
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm leading-relaxed">
                  Продукты покупаются мелкими партиями 4–6 раз в неделю, средний чек 1 100 ₽.
                </p>
                <p className="mt-2 text-sm font-medium text-[#1c8c30]">
                  Одна закупка в неделю на всех сэкономит около 15% — примерно 2 700 ₽ в месяц.
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm leading-relaxed">
                  Аня платит за аренду четвёртый месяц подряд и ждёт возврата дольше остальных.
                </p>
                <p className="mt-2 text-sm font-medium text-[#1c8c30]">
                  Стоит перевести ей 1 340 ₽ до выходных.
                </p>
              </div>
            </div>
          </Card>

          <Card title="По категориям" action="сентябрь">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={92}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                  />
                  <Bar dataKey="sum" radius={[0, 6, 6, 0]} barSize={14}>
                    {categories.map((c, i) => (
                      <Cell key={i} fill={c.trend > 50 ? "#21A038" : "#CBE7D3"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categories.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
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
      </div>
    </div>
  );
}