import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowRightLeft, CheckCircle2, MessageCircle, RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";

import {
  acceptTradeRequest,
  counterTradeRequest,
  declineTradeRequest,
  getTradeRequests,
  getTradeRequestMessages,
  sendTradeRequestMessage,
  TradeRequestMessage,
  TradeRequest,
} from "@/services/skillExchangeApi";
import { cn } from "@/lib/utils";
import { getCurrentUserIdFromToken } from "@/utils/authToken";
import { formatRelativeDate, getRequestStatusTone, inputClass, panelClass, sectionClass } from "./shared";

const getUserName = (value: string | { _id: string; fullName?: string }, fallback = "User"): string =>
  typeof value === "string" ? fallback : value.fullName || fallback;

type CounterDraft = {
  id: string;
  credits: string;
  duration: string;
  message: string;
};

export function SkillRequestsPage() {
  const currentUserId = getCurrentUserIdFromToken();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [requests, setRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [counterDraft, setCounterDraft] = useState<CounterDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeConversation, setActiveConversation] = useState<TradeRequest | null>(null);
  const [conversationMessages, setConversationMessages] = useState<TradeRequestMessage[]>([]);
  const [conversationDraft, setConversationDraft] = useState("");
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationSending, setConversationSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTradeRequests(tab);
      setRequests(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const openConversation = async (request: TradeRequest) => {
    setActiveConversation(request);
    setConversationDraft("");
    setConversationLoading(true);

    try {
      const data = await getTradeRequestMessages(request._id);
      setConversationMessages(data);
    } catch (error) {
      toast.error((error as Error).message);
      setConversationMessages([]);
    } finally {
      setConversationLoading(false);
    }
  };

  const onAccept = async (id: string) => {
    try {
      await acceptTradeRequest(id);
      toast.success("Request accepted.");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onDecline = async (id: string) => {
    try {
      await declineTradeRequest(id);
      toast.success("Request declined.");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const onCounter = async () => {
    if (!counterDraft) return;

    setSaving(true);
    try {
      await counterTradeRequest(counterDraft.id, {
        credits: counterDraft.credits ? Number(counterDraft.credits) : undefined,
        duration: counterDraft.duration ? Number(counterDraft.duration) : undefined,
        message: counterDraft.message.trim() || undefined,
      });
      toast.success("Counter offer sent.");
      setCounterDraft(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sendConversationMessage = async () => {
    if (!activeConversation || !conversationDraft.trim() || conversationSending) return;

    setConversationSending(true);
    try {
      await sendTradeRequestMessage(activeConversation._id, conversationDraft.trim());
      setConversationDraft("");
      const updatedMessages = await getTradeRequestMessages(activeConversation._id);
      setConversationMessages(updatedMessages);
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setConversationSending(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => statusFilter === "all" || request.status === statusFilter);
  }, [requests, statusFilter]);

  const countsByStatus = useMemo(() => {
    return requests.reduce<Record<string, number>>(
      (accumulator, request) => {
        accumulator[request.status] = (accumulator[request.status] || 0) + 1;
        return accumulator;
      },
      { all: requests.length },
    );
  }, [requests]);

  const statuses = ["all", "pending", "accepted", "countered", "declined", "expired"];

  return (
    <div className="space-y-8">
      <div className={sectionClass}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,160,133,0.22)] bg-[rgba(22,160,133,0.08)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#7fe7d2]">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Trade Queue
            </div>
            <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">Review proposals and keep the exchange moving</h2>
            <p className="mt-2 text-sm text-[rgba(189,216,233,0.76)] md:text-base">
              This is the Grox-style request center, now hooked into your live accept, decline, and counter backend routes.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-[rgba(22,160,133,0.22)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[rgba(22,160,133,0.08)] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
            {(["received", "sent"] as const).map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  "rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition",
                  tab === value ? "bg-[rgba(22,160,133,0.16)] text-[#7fe7d2]" : "text-[rgba(189,216,233,0.62)]",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
                  statusFilter === status
                    ? "border-[rgba(22,160,133,0.28)] bg-[rgba(22,160,133,0.12)] text-[#7fe7d2]"
                    : "border-[rgba(255,255,255,0.08)] text-[rgba(189,216,233,0.62)]",
                )}
              >
                {status} ({countsByStatus[status] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className={`${panelClass} p-10 text-center`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)]">
              <Send className="h-7 w-7 text-[rgba(189,216,233,0.45)]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">No requests in this view</h3>
            <p className="mt-2 text-sm text-[rgba(189,216,233,0.68)]">
              Switch tabs or filters to review another part of your exchange pipeline.
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const otherParty = tab === "received" ? getUserName(request.from, "Sender") : getUserName(request.to, "Receiver");

            return (
              <div
                key={request._id}
                className="rounded-[30px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(15,20,46,0.96),rgba(10,14,39,0.92))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.45)]">
                        {tab === "received" ? "Incoming request" : "Sent request"}
                      </div>
                      <h3 className="mt-2 text-2xl font-black text-white">{otherParty}</h3>
                      <p className="mt-2 text-sm text-[rgba(189,216,233,0.74)]">
                        {request.offeredSkill} for {request.requestedSkill}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-[rgba(189,216,233,0.72)]">
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {request.proposedDuration} mins
                      </div>
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {request.proposedCredits} credits
                      </div>
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {formatRelativeDate(request.createdAt)}
                      </div>
                    </div>

                    {request.counterOffer && (
                      <div className="rounded-3xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Counter offer</div>
                        <div className="mt-2 text-sm text-white">
                          {request.counterOffer.credits ? `${request.counterOffer.credits} credits` : "Credits unchanged"}
                          {" • "}
                          {request.counterOffer.duration ? `${request.counterOffer.duration} mins` : "Duration unchanged"}
                        </div>
                        {request.counterOffer.message && (
                          <p className="mt-2 text-sm text-[rgba(255,245,205,0.86)]">{request.counterOffer.message}</p>
                        )}
                      </div>
                    )}

                    {request.status === "accepted" && (
                      <div className="rounded-3xl border border-[rgba(22,160,133,0.2)] bg-[rgba(22,160,133,0.08)] p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7fe7d2]">Exchange active</div>
                        <p className="mt-2 text-sm text-[rgba(189,216,233,0.8)]">
                          The learning request was accepted. Continue deeper teaching conversations in the exchange inbox too.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getRequestStatusTone(request.status)}`}>
                      {request.status}
                    </div>

                    <button
                      type="button"
                      onClick={() => openConversation(request)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(96,165,250,0.24)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-200 transition hover:bg-[rgba(96,165,250,0.08)]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Conversation
                    </button>

                    {tab === "received" && request.status === "pending" && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => onAccept(request._id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#16A085,#12796d)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(22,160,133,0.22)] transition hover:opacity-95"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCounterDraft({
                              id: request._id,
                              credits: String(request.proposedCredits),
                              duration: String(request.proposedDuration),
                              message: request.counterOffer?.message || "",
                            })
                          }
                          className="rounded-2xl border border-[rgba(245,158,11,0.24)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-amber-200 transition hover:bg-[rgba(245,158,11,0.08)]"
                        >
                          Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => onDecline(request._id)}
                          className="rounded-2xl border border-[rgba(244,63,94,0.24)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-rose-200 transition hover:bg-[rgba(244,63,94,0.08)]"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {counterDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(1,4,18,0.82)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] border border-[rgba(245,158,11,0.22)] bg-[linear-gradient(180deg,rgba(15,20,46,0.98),rgba(10,14,39,0.97))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">Counter offer</div>
                <h3 className="mt-2 text-2xl font-black text-white">Adjust the proposal before sending it back</h3>
              </div>
              <button
                type="button"
                onClick={() => setCounterDraft(null)}
                className="rounded-xl border border-[rgba(255,255,255,0.08)] p-2 text-[rgba(189,216,233,0.7)] transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="counter-credits" className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                  Credits
                </label>
                <input
                  id="counter-credits"
                  type="number"
                  min={1}
                  className={inputClass}
                  value={counterDraft.credits}
                  onChange={(event) => setCounterDraft((current) => (current ? { ...current, credits: event.target.value } : current))}
                />
              </div>

              <div>
                <label htmlFor="counter-duration" className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                  Duration
                </label>
                <input
                  id="counter-duration"
                  type="number"
                  min={15}
                  step={15}
                  className={inputClass}
                  value={counterDraft.duration}
                  onChange={(event) => setCounterDraft((current) => (current ? { ...current, duration: event.target.value } : current))}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="counter-message" className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                Message
              </label>
              <textarea
                id="counter-message"
                rows={4}
                className={inputClass}
                value={counterDraft.message}
                onChange={(event) => setCounterDraft((current) => (current ? { ...current, message: event.target.value } : current))}
                placeholder="Add a short explanation for the counter."
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setCounterDraft(null)}
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-5 py-3 text-sm font-bold text-white transition hover:border-[rgba(245,158,11,0.22)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCounter}
                disabled={saving}
                className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#241400] transition hover:opacity-95 disabled:opacity-60"
              >
                {saving ? "Sending..." : "Send Counter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(1,4,18,0.82)] px-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-[32px] border border-[rgba(96,165,250,0.22)] bg-[linear-gradient(180deg,rgba(15,20,46,0.98),rgba(10,14,39,0.97))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-200">Negotiation chat</div>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {getUserName(activeConversation.from)} and {getUserName(activeConversation.to)}
                </h3>
                <p className="mt-2 text-sm text-[rgba(189,216,233,0.76)]">
                  Discuss how the teaching will happen, confirm the price, align on the duration, and build the collaboration before the exchange is accepted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveConversation(null)}
                className="rounded-xl border border-[rgba(255,255,255,0.08)] p-2 text-[rgba(189,216,233,0.7)] transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-white">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(189,216,233,0.5)]">Skill</div>
                <div className="mt-2">{activeConversation.requestedSkill}</div>
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-white">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(189,216,233,0.5)]">Current pricing</div>
                <div className="mt-2">{activeConversation.proposedCredits} credits</div>
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-white">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(189,216,233,0.5)]">Current duration</div>
                <div className="mt-2">{activeConversation.proposedDuration} mins</div>
              </div>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
              {conversationLoading ? (
                <div className="flex h-48 items-center justify-center text-sm text-[rgba(189,216,233,0.62)]">
                  Loading conversation...
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-[rgba(189,216,233,0.62)]">
                  No messages yet. Start by discussing the learning goal, price, and schedule.
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMessages.map((message) => (
                    <div
                      key={message._id}
                      className={cn(
                        "flex",
                        message.systemMessage
                          ? "justify-center"
                          : message.senderId?._id === currentUserId
                            ? "justify-end"
                            : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] rounded-3xl px-4 py-3 text-sm shadow-[0_10px_24px_rgba(0,0,0,0.15)]",
                          message.systemMessage
                            ? "bg-[rgba(255,255,255,0.05)] text-[rgba(189,216,233,0.72)]"
                            : message.senderId?._id === currentUserId
                              ? "bg-[linear-gradient(135deg,#16A085,#12796d)] text-white"
                              : "bg-[rgba(255,255,255,0.06)] text-white",
                        )}
                      >
                        {!message.systemMessage && (
                          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                            {message.senderId?.fullName || "User"}
                          </div>
                        )}
                        <div className="leading-6">{message.message}</div>
                        {message.createdAt && (
                          <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/60">
                            {formatRelativeDate(message.createdAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <textarea
                rows={3}
                className={inputClass}
                value={conversationDraft}
                onChange={(event) => setConversationDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendConversationMessage();
                  }
                }}
                disabled={["declined", "expired"].includes(activeConversation.status)}
                placeholder={
                  ["declined", "expired"].includes(activeConversation.status)
                    ? "This request is closed."
                    : "Type a message about pricing, teaching plan, duration, or future collaboration."
                }
              />
              <button
                type="button"
                onClick={sendConversationMessage}
                disabled={conversationSending || !conversationDraft.trim() || ["declined", "expired"].includes(activeConversation.status)}
                className="inline-flex h-12 items-center gap-2 self-end rounded-2xl bg-[linear-gradient(135deg,#16A085,#12796d)] px-5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(22,160,133,0.22)] transition hover:opacity-95 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
