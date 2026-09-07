import { useEffect, useState } from "react";
import {
  getErrorMessage,
  requestSavingsPlan,
  type SavingsPlanResponse,
} from "../services/api";
import { toast } from "./Toast";

const fmtMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

function parseTarget(raw: string): number | null {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export default function SavingsPlanner({
  statementId,
}: {
  statementId: number | null;
}) {
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<SavingsPlanResponse | null>(null);
  const [busy, setBusy] = useState(false);

  // План привязан к выписке: при смене — сбрасываем, пересчёт только по клику.
  useEffect(() => {
    setPlan(null);
    setInput("");
  }, [statementId]);

  const target = parseTarget(input);
  const canSubmit = statementId != null && target != null && !busy;

  async function submit() {
    if (statementId == null) return;
    if (target == null) {
      toast.error("Введите положительную сумму цели в рублях");
      return;
    }
    setBusy(true);
    try {
      const res = await requestSavingsPlan(statementId, target);
      setPlan(res);
    } catch (e) {
      toast.error(getErrorMessage(e, "Не удалось рассчитать план"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] backdrop-blur-2xl">
      <h2 className="text-base font-semibold text-[var(--text)]">Хочу экономить</h2>
      <p className="mb-4 mt-0.5 text-sm text-[var(--text-3)]">
        Укажите цель, распределим её по категориям
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Сумма в ₽/мес"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--field)] text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] px-4 py-2.5 text-sm"
        />
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="shrink-0 rounded-full bg-gradient-to-r from-[#A8CF38] to-[#21A038] px-5 py-2.5 text-sm font-semibold text-[#050D0A] shadow-[0_0_28px_-8px_#21A038] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "Считаем…" : "Рассчитать план"}
        </button>
      </div>

      {busy && (
        <p className="mt-3 text-sm text-[var(--text-4)]">Рассчитываем план экономии…</p>
      )}

      {plan && !busy && (
        <div className="mt-5 border-t border-[var(--border-soft)] pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-2xl font-semibold tracking-tight">
              ≈ {fmtMoney(plan.achievable_monthly_saving)}
            </p>
            <p className="text-sm text-[var(--text-3)]">
              ≈ {fmtMoney(plan.achievable_annual_saving)} / год
            </p>
          </div>

          {!plan.reachable && (
            <p className="mt-2 rounded-2xl border border-[var(--warn-border)] bg-[var(--warn-soft)] p-3 text-sm leading-relaxed text-[var(--warn-text)]">
              Это максимум, который удалось найти в ваших расходах — точная
              цель пока недостижима.
            </p>
          )}

          <div className="mt-3 divide-y divide-[var(--border-soft)]">
            {plan.distribution.map((d) => (
              <div key={d.category} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text)]">{d.category}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-4)]">
                    сейчас {fmtMoney(d.current_amount)} · −{d.reduction_percentage}%
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-[var(--accent)]">
                  ≈ {fmtMoney(d.monthly_saving)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
