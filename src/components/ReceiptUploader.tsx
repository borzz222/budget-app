import { useEffect, useRef, useState } from "react";
import {
  confirmReceipt,
  getCategories,
  getErrorMessage,
  scanReceipt,
  type ReceiptScanResult,
} from "../services/api";
import { toast } from "./Toast";

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M4 8V6a1 1 0 0 1 1-1h2M17 5h2a1 1 0 0 1 1 1v2M20 16v2a1 1 0 0 1-1 1h-2M7 19H5a1 1 0 0 1-1-1v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="7" y="9" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 12.5h4M10 15h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ReceiptUploader({
  statementId,
  onConfirmed,
}: {
  statementId: number | null;
  onConfirmed: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<ReceiptScanResult | null>(null);
  const [date, setDate] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Справочник расходных категорий (чек — всегда расход).
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((res) => {
        if (!cancelled) setExpenseCategories(res.expense);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Категория из справочника + предложенная backend'ом, даже если её
  // нет в справочнике (данные не теряем).
  const categoryOptions =
    category !== "" && !expenseCategories.includes(category)
      ? [...expenseCategories, category]
      : expenseCategories;

  async function handleFile(file: File | undefined) {
    if (!file || statementId == null || scanning) return;
    setScanning(true);
    try {
      const res = await scanReceipt(statementId, file);
      setPreview(res);
      setDate(res.date);
      setMerchant(res.merchant);
      setAmount(String(res.amount));
      setCategory(res.suggested_category);
    } catch (e) {
      toast.error(getErrorMessage(e, "Не удалось распознать чек"));
    } finally {
      setScanning(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function cancel() {
    setPreview(null);
  }

  async function confirm() {
    if (statementId == null || saving) return;
    const parsedAmount = Number(String(amount).replace(",", "."));
    if (!date || !merchant.trim() || !category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Проверьте дату, магазин, сумму и категорию");
      return;
    }
    setSaving(true);
    try {
      await confirmReceipt(statementId, {
        date,
        merchant: merchant.trim(),
        amount: parsedAmount,
        category: category.trim(),
      });
      toast.success("Транзакция добавлена");
      setPreview(null);
      onConfirmed();
    } catch (e) {
      toast.error(getErrorMessage(e, "Не удалось сохранить транзакцию"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-white/[0.08] pt-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={statementId == null || scanning}
          className="flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-sm font-medium text-[#C4D4CB] transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ReceiptIcon />
          {scanning ? "Распознаём чек…" : "Загрузить чек"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-[#5C7268]">JPG или PNG, не HEIC</p>

      {preview && !scanning && (
        <div className="mt-4 space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
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
            <span className="mb-1 block text-xs text-[#8FA79A]">Магазин</span>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
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
              {categoryOptions.map((c) => (
                <option key={c} value={c} className="bg-[#0D1F18] text-[#F2F5F3]">
                  {c}
                </option>
              ))}
            </select>
          </label>
          {preview.category_confidence < 0.5 && (
            <p className="rounded-2xl border border-[#A8CF38]/25 bg-[#A8CF38]/[0.08] p-3 text-xs leading-relaxed text-[#D5E88A]">
              Низкая уверенность, проверьте категорию
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={confirm}
              disabled={saving}
              className="flex-1 py-2 text-sm rounded-full bg-gradient-to-r from-[#A8CF38] to-[#21A038] text-[#050D0A] font-semibold shadow-[0_0_28px_-8px_#21A038] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {saving ? "Сохраняем…" : "Подтвердить и сохранить"}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="rounded-full border border-white/[0.10] px-4 py-2 text-sm font-medium text-[#8FA79A] transition hover:bg-white/[0.07] disabled:opacity-40"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
