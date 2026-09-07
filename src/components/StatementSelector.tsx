import type { Statement } from "../services/api";

export default function StatementSelector({
  statements,
  currentId,
  onSelect,
}: {
  statements: Statement[];
  currentId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-neutral-900">Выписка</h2>
      <p className="mb-4 text-sm text-neutral-500">Аналитика и транзакции — по выбранной</p>
      {statements.length === 0 ? (
        <p className="text-sm text-neutral-400">Пока нет загруженных выписок</p>
      ) : (
        <select
          value={currentId ?? ""}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-800 outline-none transition focus:border-[#21A038]"
        >
          {statements.map((s) => (
            <option key={s.id} value={s.id}>
              {s.file_name} · {s.transactions_count} оп.
              {s.period_from && s.period_to ? ` · ${s.period_from} — ${s.period_to}` : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
