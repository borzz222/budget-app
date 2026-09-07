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
        className="flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-base leading-none">+</span>
        Добавить операцию
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl bg-neutral-50 p-4">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-neutral-100 p-1">
        <button
          onClick={() => switchType("debit")}
          className={`rounded-full py-1.5 text-sm font-medium transition ${
            entryType === "debit"
              ? "bg-white text-red-600 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Расход
        </button>
        <button
          onClick={() => switchType("credit")}
          className={`rounded-full py-1.5 text-sm font-medium transition ${
            entryType === "credit"
              ? "bg-white text-[#1c8c30] shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Доход
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Дата</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-[#21A038]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-neutral-500">Сумма, ₽</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-[#21A038]"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-neutral-500">Описание</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например: обед в кафе"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-[#21A038]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs text-neutral-500">Категория</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-[#21A038]"
        >
          <option value="">— выберите —</option>
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-full bg-[#21A038] py-2 text-sm font-medium text-white transition hover:bg-[#1c8c30] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-white disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
