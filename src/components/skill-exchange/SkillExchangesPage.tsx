import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import {
  Agreement,
  confirmSession,
  createSession,
  fileDispute,
  getAgreements,
  getReviews,
  getSessions,
  reportNoShow,
  Review,
  Session,
  submitReview,
} from "@/services/skillExchangeApi";
import AgreementMessageThread from "@/components/AgreementMessageThread";
import { getCurrentUserIdFromToken } from "@/utils/authToken";
import { inputClass, sectionClass } from "./shared";

const getUserId = (value: string | { _id: string; fullName?: string }): string =>
  typeof value === "string" ? value : value._id;

const getUserName = (value: string | { _id: string; fullName?: string }, fallback = "Partner"): string =>
  typeof value === "string" ? fallback : value.fullName || fallback;

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "active":
      return "bg-green-600";
    case "completed":
      return "bg-blue-600";
    case "disputed":
      return "bg-orange-500";
    case "cancelled":
      return "bg-red-600";
    default:
      return "bg-gray-500";
  }
};

const getTimeRemaining = (scheduledAt: string, nowTimestamp: number): string => {
  const diff = new Date(scheduledAt).getTime() - nowTimestamp;
  if (!Number.isFinite(diff) || diff <= 0) return "Started";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Starts in ${hours}h ${minutes}m`;
};

const getReviewerId = (reviewer: string | { _id: string; fullName?: string }): string =>
  typeof reviewer === "string" ? reviewer : reviewer._id;

export function SkillExchangesPage() {
  const currentUserId = getCurrentUserIdFromToken();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [sessionsByAgreement, setSessionsByAgreement] = useState<Record<string, Session[]>>({});
  const [sessionDraft, setSessionDraft] = useState<Record<string, string>>({});
  const [disputeAgreementId, setDisputeAgreementId] = useState<string | null>(null);
  const [noShowSessionId, setNoShowSessionId] = useState<string | null>(null);
  const [reviewAgreementId, setReviewAgreementId] = useState<string | null>(null);
  const [reviewTargetId, setReviewTargetId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [disputeReason, setDisputeReason] = useState<"noshow" | "quality" | "other">("noshow");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [noShowProof, setNoShowProof] = useState("");
  const [reviewedAgreementIds, setReviewedAgreementIds] = useState<Record<string, boolean>>({});
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const navigate = useNavigate();

  const normalizeList = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

  const load = useCallback(async () => {
    try {
      const agreementsData = normalizeList(await getAgreements());
      setAgreements(agreementsData);
      const sessionResults = await Promise.allSettled(
        agreementsData.map(async (agreement) => [agreement._id, await getSessions(agreement._id)] as const),
      );
      const sessionPairs = sessionResults
        .filter((result): result is PromiseFulfilledResult<readonly [string, Session[]]> => result.status === "fulfilled")
        .map((result) => result.value);
      setSessionsByAgreement(Object.fromEntries(sessionPairs));

      const completedAgreements = agreementsData.filter((agreement) => agreement.status === "completed");
      const participantsByAgreement = Object.fromEntries(
        completedAgreements.map((agreement) => {
          const partner = agreement.participants
            .map((participant) => ({
              id: getUserId(participant),
              name: getUserName(participant, "Partner"),
            }))
            .find((participant) => participant.id !== currentUserId);

          return [agreement._id, partner?.id || ""] as const;
        }),
      );

      const uniquePartnerIds = Array.from(
        new Set(Object.values(participantsByAgreement).filter((partnerId) => Boolean(partnerId))),
      );

      const reviewsByPartner = await Promise.allSettled(
        uniquePartnerIds.map(async (partnerId) => [partnerId, await getReviews(partnerId)] as const),
      );

      const reviewPairs = reviewsByPartner
        .filter((result): result is PromiseFulfilledResult<readonly [string, Review[]]> => result.status === "fulfilled")
        .map((result) => result.value);

      const reviewLookup = new Map<string, Review[]>(reviewPairs);
      const reviewedMap: Record<string, boolean> = {};

      completedAgreements.forEach((agreement) => {
        const partnerId = participantsByAgreement[agreement._id];
        const partnerReviews = partnerId ? reviewLookup.get(partnerId) || [] : [];

        reviewedMap[agreement._id] = partnerReviews.some((review) => {
          const reviewerId = getReviewerId(review.reviewerId);
          return reviewerId === currentUserId && review.agreementId === agreement._id;
        });
      });

      setReviewedAgreementIds(reviewedMap);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getPartner = (agreement: Agreement) => {
    const participants = agreement.participants.map((participant) => ({
      id: getUserId(participant),
      name: getUserName(participant, "Partner"),
    }));
    return participants.find((participant) => participant.id !== currentUserId) || participants[0];
  };

  const createNewSession = async (agreementId: string) => {
    const dateTime = sessionDraft[agreementId];
    if (!dateTime) return toast.error("Pick a session date and time.");
    try {
      await createSession(agreementId, new Date(dateTime).toISOString());
      toast.success("Session created.");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const confirm = async (sessionId: string) => {
    try {
      await confirmSession(sessionId);
      toast.success("Session confirmation submitted.");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitNoShow = async () => {
    if (!noShowSessionId) return;
    try {
      await reportNoShow(noShowSessionId, noShowReason, noShowProof);
      toast.success("No-show reported.");
      setNoShowSessionId(null);
      setNoShowReason("");
      setNoShowProof("");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitDisputeModal = async () => {
    if (!disputeAgreementId) return;
    try {
      await fileDispute({
        agreementId: disputeAgreementId,
        reason: disputeReason,
        description: disputeDescription,
        evidence: disputeEvidence ? [disputeEvidence] : [],
      });
      toast.success("Dispute filed.");
      setDisputeAgreementId(null);
      setDisputeDescription("");
      setDisputeEvidence("");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitReviewModal = async () => {
    if (!reviewAgreementId || !reviewTargetId) return toast.error("Select a review target.");
    const tags = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-review-tag]:checked")).map((el) => el.value);
    const mergedComment = [reviewComment.trim(), tags.length ? `Tags: ${tags.join(", ")}` : ""].filter(Boolean).join(" | ");
    try {
      await submitReview({
        agreementId: reviewAgreementId,
        revieweeId: reviewTargetId,
        rating: reviewRating,
        comment: mergedComment,
      });
      toast.success("Review submitted.");
      setReviewedAgreementIds((prev) => ({ ...prev, [reviewAgreementId]: true }));
      setReviewAgreementId(null);
      setReviewComment("");
      setReviewTargetId("");
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const visibleAgreements = useMemo(
    () => agreements,
    [agreements],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white">Exchanges Dashboard</h2>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <div className="space-y-4">
        {visibleAgreements.map((agreement) => {
          const partner = getPartner(agreement);
          const sessions = sessionsByAgreement[agreement._id] || [];
          const latest = sessions[sessions.length - 1];
          const confirmedUserIds = (latest?.participantConfirmations || []).map((confirmation) =>
            getUserId(confirmation.userId),
          );

          const isConfirmed = (userId: string) => confirmedUserIds.includes(userId);

          return (
            <div key={agreement._id} className={sectionClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">{agreement.skill}</p>
                  <p className="text-sm text-[rgba(189,216,233,0.75)]">Partner: {partner?.name || "Unknown"}</p>
                  <p className="text-sm text-[rgba(189,216,233,0.75)]">Scheduled: {latest ? new Date(latest.scheduledAt).toLocaleString() : "Not scheduled"}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white ${getStatusBadgeClass(agreement.status)}`}>
                  {agreement.status}
                </span>
                {partner && (
                  <Button variant="outline" onClick={() => navigate(`/profile/${partner.id}`)}>View Profile</Button>
                )}
              </div>

              {agreement.status === "completed" && !reviewedAgreementIds[agreement._id] && (
                <div className="mt-4 rounded-md border border-[#f3d98b] bg-[#fff3cd] px-3 py-2 text-sm text-[#664d03]">
                  Please leave a review for this exchange.
                </div>
              )}

              <div className="mt-4 border-t border-[rgba(22,160,133,0.22)] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgba(189,216,233,0.8)]">Session Details</p>

                {latest?.status === "scheduled" && (
                  <p className="mb-2 text-sm font-medium text-[#9b8cff]">
                    {getTimeRemaining(latest.scheduledAt, nowTimestamp)}
                  </p>
                )}

                {latest && agreement.participants.length > 0 && (
                  <div className="mb-3 rounded-xl border border-[rgba(22,160,133,0.2)] bg-[rgba(20,37,62,0.35)] p-3 text-sm text-[rgba(189,216,233,0.86)]">
                    {agreement.participants.map((participant) => {
                      const participantId = getUserId(participant);
                      const participantName = getUserName(
                        participant,
                        participantId === currentUserId ? "You" : "Partner",
                      );

                      return (
                        <div key={participantId}>
                          {participantName} - {isConfirmed(participantId) ? "✅ Confirmed" : "⏳ Pending"}
                        </div>
                      );
                    })}
                  </div>
                )}

                {latest?.noShowReported && (
                  <div className="mb-3 rounded-md border border-[#f1aeb5] bg-[#f8d7da] px-3 py-2 text-sm text-[#842029]">
                    ⚠ No-show reported.
                  </div>
                )}

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input type="datetime-local" className={inputClass} value={sessionDraft[agreement._id] || ""} onChange={(e) => setSessionDraft((prev) => ({ ...prev, [agreement._id]: e.target.value }))} />
                <Button disabled={agreement.status !== "active"} onClick={() => createNewSession(agreement._id)}>Create Session</Button>
                <Button variant="outline" disabled={!latest || latest.status !== "scheduled"} onClick={() => latest && confirm(latest._id)}>Confirm Session</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" disabled={!latest} onClick={() => latest && setNoShowSessionId(latest._id)}>Report No-Show</Button>
                <Button variant="outline" onClick={() => setDisputeAgreementId(agreement._id)}>File Dispute</Button>
                <Button variant="outline" onClick={() => {
                  setReviewAgreementId(agreement._id);
                  setReviewTargetId(partner?.id || "");
                }}>Submit Review</Button>
              </div>
              </div>

              <div className="mt-4 border-t border-[rgba(22,160,133,0.22)] pt-4">
              <AgreementMessageThread
                agreementId={agreement._id}
                disabled={agreement.status !== "active"}
              />
              </div>
            </div>
          );
        })}
        {visibleAgreements.length === 0 && <div className={sectionClass}>No agreements yet.</div>}
      </div>

      {noShowSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0A0E27] p-6">
            <h3 className="text-xl font-bold text-white">Report No-Show</h3>
            <input className={`${inputClass} mt-3`} placeholder="Reason" value={noShowReason} onChange={(e) => setNoShowReason(e.target.value)} />
            <textarea className={`${inputClass} mt-3`} placeholder="Proof URL or evidence text" value={noShowProof} onChange={(e) => setNoShowProof(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoShowSessionId(null)}>Cancel</Button>
              <Button onClick={submitNoShow}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      {disputeAgreementId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0A0E27] p-6">
            <h3 className="text-xl font-bold text-white">File Dispute</h3>
            <select className={`${inputClass} mt-3`} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value as "noshow" | "quality" | "other")}>
              <option value="noshow">No-show</option>
              <option value="quality">Quality</option>
              <option value="other">Other</option>
            </select>
            <textarea className={`${inputClass} mt-3`} placeholder="Evidence text or URL" value={disputeEvidence} onChange={(e) => setDisputeEvidence(e.target.value)} />
            <textarea className={`${inputClass} mt-3`} placeholder="Description" value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisputeAgreementId(null)}>Cancel</Button>
              <Button onClick={submitDisputeModal}>Submit Dispute</Button>
            </div>
          </div>
        </div>
      )}

      {reviewAgreementId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0A0E27] p-6">
            <h3 className="text-xl font-bold text-white">Submit Review</h3>
            <label className="mt-3 block text-sm text-[rgba(189,216,233,0.8)]">Rating (1-5)</label>
            <input className={inputClass} type="number" min={1} max={5} value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} />
            <textarea className={`${inputClass} mt-3`} placeholder="Comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[rgba(189,216,233,0.85)]">
              {["helpful", "punctual", "knowledgeable", "clear-communicator"].map((tag) => (
                <label key={tag} className="flex items-center gap-2">
                  <input data-review-tag type="checkbox" value={tag} />
                  {tag}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewAgreementId(null)}>Cancel</Button>
              <Button onClick={submitReviewModal}>Submit Review</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
