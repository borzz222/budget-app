import { useEffect, useState } from "react";
import {
  createManualTransaction,
  getCategories,
  getErrorMessage,
} from "../services/api";
import { toast } from "./Toast";

type EntryType = "debit" | "credit";

const today = () => new Date().toISOString().slice(0, 10);

export default function ManualTransactionForm({
  statementId,
  onSaved,
}: {
  statementId: number | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("debit");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((res) => {
        if (cancelled) return;
        setExpenseCategories(res.expense);
        setIncomeCategories(res.income);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const options = entryType === "debit" ? expenseCategories : incomeCategories;

  function switchType(next: EntryType) {
    setEntryType(next);
    setCategory("");
  }

  async function save() {
    if (statementId == null || busy) return;
    const parsedAmount = Number(String(amount).replace(",", "."));
    if (!date || !description.trim() || !category || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Проверьте дату, описание, сумму и категорию");
      return;
    }
    setBusy(true);
    try {
      await createManualTransaction(statementId, {
        date,
        description: description.trim(),
        amount: parsedAmount,
        category,
        type: entryType,
      });
      toast.success("Операция добавлена");
      setOpen(false);
      setDescription("");
      setAmount("");
      setCategory("");
      setDate(today());
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e, "Не удалось сохранить операцию"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={statementId == null}
        className="flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-sm font-medium text-[#C4D4CB] transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-base leading-none">+</span>
        Добавить операцию
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="grid grid-cols-2 gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] p-1">
        <button
          onClick={() => switchType("debit")}
          className={`rounded-full py-1.5 text-sm font-medium transition ${
            entryType === "debit"
              ? "bg-[#FF6B6B]/15 text-[#FF6B6B]"
              : "text-[#5C7268] hover:text-[#C4D4CB]"
          }`}
        >
          Расход
        </button>
        <button
          onClick={() => switchType("credit")}
          className={`rounded-full py-1.5 text-sm font-medium transition ${
            entryType === "credit"
              ? "bg-[#3FC8A0]/15 text-[#3FC8A0]"
              : "text-[#5C7268] hover:text-[#C4D4CB]"
          }`}
        >
          Доход
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[#8FA79A]">Дата</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.10] bg-[#050D0A]/70 px-3 py-2 text-sm text-[#F2F5F3] placeholder-[#5C7268] outline-none transition focus:border-[#3FC8A0] [color-scheme:dark]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[#8FA79A]">Сумма, ₽</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.10] bg-[#050D0A]/70 px-3 py-2 text-sm text-[#F2F5F3] placeholder-[#5C7268] outline-none transition focus:border-[#3FC8A0] [color-scheme:dark]"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-[#8FA79A]">Описание</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например: обед в кафе"
          className="w-full rounded-2xl border border-white/[0.10] bg-[#050D0A]/70 px-3 py-2 text-sm text-[#F2F5F3] placeholder-[#5C7268] outline-none transition focus:border-[#3FC8A0] [color-scheme:dark]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs text-[#8FA79A]">Категория</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-2xl border border-white/[0.10] bg-[#050D0A]/70 px-3 py-2 text-sm text-[#F2F5F3] placeholder-[#5C7268] outline-none transition focus:border-[#3FC8A0] [color-scheme:dark]"
        >
          <option value="" className="bg-[#0D1F18] text-[#F2F5F3]">— выберите —</option>
          {options.map((c) => (
            <option key={c} value={c} className="bg-[#0D1F18] text-[#F2F5F3]">
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 py-2 text-sm rounded-full bg-gradient-to-r from-[#A8CF38] to-[#21A038] text-[#050D0A] font-semibold shadow-[0_0_28px_-8px_#21A038] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-full border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#8FA79A] transition hover:bg-white/[0.07] disabled:opacity-40"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
