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
        stroke="#050D0A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10" r="1" fill="#050D0A" />
      <circle cx="12.5" cy="10" r="1" fill="#050D0A" />
      <circle cx="16" cy="10" r="1" fill="#050D0A" />
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
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#A8CF38] to-[#21A038] shadow-[0_0_32px_-6px_#21A038] transition hover:brightness-110"
        >
          <ChatIcon />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[500px] max-h-[70vh] w-[370px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/[0.10] bg-[#0A1611]/95 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0F2A1F] to-[#123A2A] px-5 py-3.5 text-[#F2F5F3]">
            <p className="text-sm font-semibold">Финансовый консультант</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть чат"
              className="rounded-full px-2 text-lg leading-none text-[#8FA79A] transition hover:bg-white/10 hover:text-[#F2F5F3]"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#050D0A]/60 p-4">
            {history.length === 0 && !busy && (
              <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/[0.08] bg-white/[0.05] p-3">
                <p className="text-sm leading-relaxed text-[#F2F5F3]">
                  Привет! Я ваш финансовый консультант. Спросите меня о ваших
                  тратах, доходах или как сэкономить.
                </p>
              </div>
            )}

            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-[#A8CF38] to-[#21A038] text-[#050D0A] font-medium"
                      : "rounded-tl-md border border-white/[0.08] bg-white/[0.05] text-[#F2F5F3]"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-white/[0.08] bg-white/[0.05] p-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5C7268]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5C7268] [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#5C7268] [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.08] p-3">
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
                className="max-h-28 w-full resize-none rounded-2xl border border-white/[0.10] bg-[#050D0A]/70 px-3 py-2 text-sm text-[#F2F5F3] placeholder-[#5C7268] outline-none transition focus:border-[#3FC8A0] [color-scheme:dark] disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={!canSend}
                aria-label="Отправить"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A8CF38] to-[#21A038] text-[#050D0A] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path
                    d="M4 12 20 4l-4.5 8L20 20 4 12Z"
                    stroke="#050D0A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {input.length > COUNTER_FROM && (
              <p className="mt-1 text-right text-xs text-[#5C7268]">
                {input.length}/{MAX_LENGTH}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
