import { useEffect, useRef, useState } from "react";
import {
  getErrorMessage,
  sendChatMessage,
  type ChatMessage,
} from "../services/api";
import { toast } from "./Toast";

const MAX_LENGTH = 500;
const COUNTER_FROM = 400;

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path
        d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v7a3.5 3.5 0 0 1-3.5 3.5H9l-5 4v-11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="12.5" cy="10" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

export default function FinancialChatWidget() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open ]);

  const trimmed = input.trim();
  const canSend = trimmed !== "" && input.length <= MAX_LENGTH && !busy;

  async function send() {
    if (!canSend) {
      if (trimmed === "") return;
      if (input.length > MAX_LENGTH) {
        toast.error("Сообщение должно быть не длиннее 500 символов");
      }
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...history, userMessage];
    setHistory(nextHistory);
    setInput("");
    setBusy(true);

    try {
      const res = await sendChatMessage(userMessage.content, nextHistory);
      setHistory((h) => [...h, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(getErrorMessage(e, "Не удалось получить ответ"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Финансовый консультант"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-border)] dark:bg-gradient-to-br dark:from-[#A8CF38] dark:to-[#21A038] shadow-[0_0_32px_-6px_#21A038] transition-all duration-200 ease-in-out hover:brightness-110"
        >
          <ChatIcon />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[500px] max-h-[70vh] w-[370px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-white dark:bg-[#0D1A14] shadow-[var(--shadow-pop)] [transform:translateZ(0)]">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0F3D2E] to-[#12603F] px-5 py-3.5 text-white">
            <p className="text-sm font-semibold">Финансовый консультант</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть чат"
              className="rounded-full px-2 text-lg leading-none text-[var(--text-3)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden bg-[var(--surface-2)] p-4">
            {history.length === 0 && !busy && (
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--surface-3)] p-3">
                <p className="break-words text-sm leading-relaxed text-[var(--text)]">
                  Привет! Я ваш финансовый консультант. Спросите меня о ваших
                  тратах, доходах или как сэкономить.
                </p>
              </div>
            )}

            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`min-w-0 max-w-[85%] overflow-hidden rounded-2xl p-3 shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-md bg-[var(--accent-border)] dark:bg-gradient-to-br dark:from-[#A8CF38] dark:to-[#21A038] text-white font-medium dark:text-[#050D0A]"
                      : "rounded-tl-md border border-[var(--border)] bg-[var(--field)] text-[var(--text)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[var(--border)] bg-[var(--surface-3)] p-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5C7268]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5C7268] [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5C7268] [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={MAX_LENGTH}
                value={input}
                disabled={busy}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Спросите о финансах…"
                className="max-h-28 w-full resize-none rounded-2xl border border-[var(--border-strong)] bg-[var(--field)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-4)] outline-none transition focus:border-[var(--accent-border)] disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={!canSend}
                aria-label="Отправить"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-border)] dark:bg-gradient-to-br dark:from-[#A8CF38] dark:to-[#21A038] text-white transition-all duration-200 ease-in-out hover:brightness-110 dark:text-[#050D0A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path
                    d="M4 12 20 4l-4.5 8L20 20 4 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {input.length > COUNTER_FROM && (
              <p className="mt-1 text-right text-xs text-[var(--text-4)]">
                {input.length}/{MAX_LENGTH}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
