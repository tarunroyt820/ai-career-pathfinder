import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import {
  AgreementMessageItem,
  fetchAgreementMessages,
  sendAgreementMessage,
} from "@/services/agreementMessageApi";
import { inputClass } from "@/components/skill-exchange/shared";

interface Props {
  agreementId: string;
  disabled?: boolean;
}

const AgreementMessageThread = ({ agreementId, disabled = false }: Props) => {
  const [messages, setMessages] = useState<AgreementMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAgreementMessages(agreementId);
      setMessages(Array.isArray(response.data?.messages) ? response.data.messages : []);
    } catch (_error) {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || disabled || sending) return;

    const optimisticId = `tmp-${Date.now()}`;
    const optimisticMessage: AgreementMessageItem = {
      _id: optimisticId,
      agreementId,
      message: messageText,
      systemMessage: false,
      senderId: { fullName: "You" },
      createdAt: new Date().toISOString(),
    };

    setSending(true);
    setError(null);
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    try {
      await sendAgreementMessage(agreementId, messageText);
      await loadMessages();
    } catch (_error) {
      setMessages((prev) => prev.filter((message) => message._id !== optimisticId));
      setInput(messageText);
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(10,14,39,0.5)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[rgba(189,216,233,0.85)]">Agreement Messages</h4>
        {loading && <p className="text-xs text-[rgba(189,216,233,0.75)]">Loading…</p>}
      </div>

      {error && <p className="mb-2 text-sm text-red-300">{error}</p>}

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-[rgba(22,160,133,0.2)] bg-[rgba(20,37,62,0.35)] p-3">
        {messages.map((message) => {
          const senderName = message?.senderId?.fullName || message?.senderId?.name || "User";
          const isSystemMessage = Boolean(message?.systemMessage);

          return (
            <div
              key={String(message._id)}
              className={isSystemMessage ? "text-center text-xs italic text-[rgba(189,216,233,0.6)]" : "text-left text-sm text-white"}
            >
              {!isSystemMessage && <span className="font-semibold text-[rgba(189,216,233,0.9)]">{senderName}: </span>}
              <span>{message?.message || ""}</span>
            </div>
          );
        })}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-[rgba(189,216,233,0.65)]">No messages yet.</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          aria-label="Message"
          className={inputClass}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled || sending}
          placeholder={disabled ? "Messaging is disabled for non-active agreements." : "Type a message…"}
          maxLength={2000}
        />
        <Button onClick={handleSend} disabled={disabled || sending || !input.trim()}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default AgreementMessageThread;
