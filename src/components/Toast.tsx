import { useSyncExternalStore } from "react";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function push(kind: ToastKind, text: string, ttlMs: number) {
  const id = nextId++;
  items = [...items, { id, kind, text }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, ttlMs);
}

export const toast = {
  success(text: string) {
    push("success", text, 5000);
  },
  error(text: string) {
    push("error", text, 7000);
  },
};

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ToastItem[] {
  return items;
}

/* Всплывающие уведомления в стиле дашборда: скругление, тень,
 * зелёный акцент — успех, красный — ошибка. Закрываются сами
 * или по клику. Монтируется один раз в корне App. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[var(--overlay)] p-4 text-left shadow-[var(--shadow-pop)] backdrop-blur-xl transition hover:bg-[var(--surface-3)] ${
            t.kind === "success" ? "border-[var(--accent-border)]/50" : "border-[var(--danger)]/45"
          }`}
        >
          <span
            className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              t.kind === "success" ? "bg-[#21A038]" : "bg-[var(--danger)]"
            }`}
          />
          <span className="text-sm leading-snug text-[var(--text)]">{t.text}</span>
        </button>
      ))}
    </div>
  );
}
