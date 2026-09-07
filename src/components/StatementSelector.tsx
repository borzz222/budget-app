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
      <h2 className="mb-1 text-base font-semibold text-[#F2F5F3]">Выписка</h2>
      <p className="mb-4 text-sm text-[#8FA79A]">Аналитика и транзакции — по выбранной</p>
      {statements.length === 0 ? (
        <p className="text-sm text-[#5C7268]">Пока нет загруженных выписок</p>
      ) : (
        <select
          value={currentId ?? ""}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full rounded-2xl border border-white/[0.08] bg-[#050D0A]/60 px-4 py-2.5 text-sm font-medium text-[#F2F5F3] outline-none transition focus:border-[#3FC8A0]"
        >
          {statements.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#0D1F18] text-[#F2F5F3]">
              {s.file_name} · {s.transactions_count} оп.
              {s.period_from && s.period_to ? ` · ${s.period_from} — ${s.period_to}` : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
