import { useState, useRef } from "react";
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
  { name: "Аренда", sum: 32000, trend: 0, color: "#0F3D2E" },
  { name: "Продукты", sum: 18400, trend: 4, color: "#12603F" },
  { name: "Доставка", sum: 6800, trend: 180, color: "#21A038" },
  { name: "Развлечения", sum: 5600, trend: -12, color: "#4CAF6D" },
  { name: "Коммуналка", sum: 4200, trend: 6, color: "#7BC894" },
  { name: "Другое", sum: 2400, trend: 8, color: "#E3F1E7" },
];

const byMember = [
  { name: "Аня", sum: 38200, color: "#0F5132" },
  { name: "Ты", sum: 17898, color: "#21A038" },
  { name: "Дима", sum: 9600, color: "#4CAF6D" },
  { name: "Соня", sum: 5892, color: "#A3D9B1" },
];

const spentByMember = [
  { name: "Аня", sum: 19420, color: "#A8CF38" },
  { name: "Ты", sum: 17898, color: "#3FC8A0" },
  { name: "Дима", sum: 18630, color: "#B54FB5" },
  { name: "Соня", sum: 15642, color: "#9BA3AE" },
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

const goal = {
  name: "Новый диван в гостиную",
  target: 45000,
  saved: 28400,
  deadline: "к 15 октября",
};
/* ---------------- МЕЛКИЕ КОМПОНЕНТЫ ---------------- */

const money = (n: number) => n.toLocaleString("ru-RU") + " ₽";
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

// Вариант 2: две встречные стрелки
function MarkArrows() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path
        d="M3 8.5h13m0 0-3.5-3.5M16 8.5 12.5 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 15.5H8m0 0 3.5-3.5M8 15.5l3.5 3.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

// Вариант 3: знак равенства
function MarkEqual() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect x="4" y="8" width="16" height="3" rx="1.5" fill="white" />
      <rect x="4" y="14" width="16" height="3" rx="1.5" fill="white" />
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
  const daysLeft = 17;
  const forecastDate = "21 сентября";

  return (
    <div className="min-h-screen bg-[#EFEEEA] px-4 py-5 font-sans text-neutral-900 md:px-8 md:py-7">
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
          </div>

          <div className="flex items-center gap-2">
            {card ? (
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
            )}
            <button className="rounded-full bg-[#21A038] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c8c30]">
              Добавить трату
            </button>
          </div>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-1 gap-4 md:gap-5 lg:mb-5 lg:grid-cols-3">
        <Stat label="Общие траты в сентябре" value={money(71590)} hint="за 4 дня" />
        <Stat label="Незакрытых долгов" value="3" hint="на сумму 2 590 ₽" />
        <Stat
          label="Бюджет на сентябрь"
          value={money(budgetTotal)}
          hint={`потрачено ${Math.round((budgetSpent / budgetTotal) * 100)}%`}
          dark
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
        <div className="space-y-4 md:space-y-5 lg:col-span-2">
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
                        <button className="rounded-full bg-[#21A038] px-4 py-1.5 text-xs font-medium text-white">
                          Перевести по СБП
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
            <div className="h-40">
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
                    formatter={(v: number) => [money(v), "Потрачено"]}
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

<Card title="Расходы по категориям" action="сентябрь">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
                    formatter={(v: number) => [money(v), "Сумма"]}
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
            <div className="mt-4 divide-y divide-neutral-100 border-t border-neutral-300">
              {categories.map((c) => (
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
            <button className="mt-4 w-full rounded-full bg-[#21A038] py-2.5 text-sm font-medium text-white transition hover:bg-[#1c8c30]">
              Внести взнос
            </button>
          </Card>
          <Card title="Кто сколько потратил" action="сентябрь">
            <div className="flex items-center gap-4">
              <div className="relative h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spentByMember} dataKey="sum" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={2}>
                      {spentByMember.map((m, i) => (
                        <Cell key={i} fill={m.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => money(v)}
                      contentStyle={{ borderRadius: 12, border: "none", fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-semibold tracking-tight">
                    {Math.round(
                      (spentByMember.find((m) => m.name === ME)!.sum /
                        spentByMember.reduce((s, m) => s + m.sum, 0)) * 100
                    )}
                    %
                  </p>
                  <p className="text-[10px] text-neutral-400">твоя доля</p>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {spentByMember.map((m) => {
                  const total = spentByMember.reduce((s, x) => s + x.sum, 0);
                  const pct = Math.round((m.sum / total) * 100);
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
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-sm leading-relaxed">
                Доставка выросла в 2,8 раза за две недели —
                6&nbsp;800&nbsp;₽ против средних 2&nbsp;400&nbsp;₽.
        Почти всё по будням после 21:00.
      </p>
    </div>
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-sm leading-relaxed">
                Продукты покупают мелкими партиями 4–6 раз в неделю, средний
                чек&nbsp;1&nbsp;100&nbsp;₽.
      </p>
    </div>
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-sm leading-relaxed">
        Аня платит за аренду четвёртый месяц подряд и ждёт возврата дольше остальных.
      </p>
    </div>
  </div>
</Card>

<Card title="Как сэкономить" action="до 5 700 ₽ в месяц">
  <div className="space-y-3">
    <div className="rounded-2xl bg-[#F1F8F3] p-4">
      <p className="text-sm leading-relaxed">
        Два домашних ужина в неделю вместо доставки.
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#1c8c30]">около 3 000 ₽ в месяц</p>
    </div>
    <div className="rounded-2xl bg-[#F1F8F3] p-4">
      <p className="text-sm leading-relaxed">
        Одна общая закупка продуктов в неделю вместо мелких походов.
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#1c8c30]">
        около 2 700 ₽ в месяц, это 15%
      </p>
    </div>
    <div className="rounded-2xl bg-[#F1F8F3] p-4">
      <p className="text-sm leading-relaxed">
        Перевести Ане 1 340 ₽ до выходных, чтобы закрыть долг за аренду.
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#1c8c30]">снимет напряжение</p>
    </div>
  </div>
</Card>
        </div>
      </div>
    </div>
  );
}