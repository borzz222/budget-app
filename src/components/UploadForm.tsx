import { useRef, useState } from "react";
import { getErrorMessage, uploadStatement, type Statement } from "../services/api";
import { toast } from "./Toast";

export default function UploadForm({
  onUploaded,
}: {
  onUploaded: (statement: Statement) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!file || busy) return;
    setBusy(true);
    try {
      const res = await uploadStatement(file);
      onUploaded(res.data);
      toast.success(
        `Выписка успешно загружена — транзакций: ${res.imported_transactions_count}`,
      );
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      toast.error(getErrorMessage(e, "Ошибка загрузки файла"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-[#F2F5F3]">Загрузка выписки</h2>
      <p className="mb-4 text-sm text-[#8FA79A]">CSV-файл банковской выписки</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer text-sm text-[#5C7268] file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-white/[0.10] file:bg-white/[0.06] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#F2F5F3] file:transition hover:file:bg-white/[0.12]"
        />
        <button
          onClick={submit}
          disabled={!file || busy}
          className="shrink-0 rounded-full bg-gradient-to-r from-[#A8CF38] to-[#21A038] px-5 py-2.5 text-sm font-semibold text-[#050D0A] shadow-[0_0_28px_-8px_#21A038] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {busy ? "Загрузка…" : "Загрузить выписку"}
        </button>
      </div>
      {file && <p className="mt-2 text-xs text-[#5C7268]">Выбран: {file.name}</p>}
    </div>
  );
}
