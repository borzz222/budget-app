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
      <h2 className="mb-1 text-base font-semibold text-neutral-900">Загрузка выписки</h2>
      <p className="mb-4 text-sm text-neutral-500">CSV-файл банковской выписки</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-full file:border file:border-neutral-200 file:bg-neutral-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-100"
        />
        <button
          onClick={submit}
          disabled={!file || busy}
          className="shrink-0 rounded-full bg-[#21A038] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1c8c30] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Загрузка…" : "Загрузить выписку"}
        </button>
      </div>
      {file && <p className="mt-2 text-xs text-neutral-400">Выбран: {file.name}</p>}
    </div>
  );
}
