import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, RefreshCw, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import {
  acceptGlobalLearningRequest,
  cancelGlobalLearningRequest,
  getGlobalLearningRequests,
  getMyGlobalLearningRequests,
  GlobalLearningRequest,
} from "@/services/skillExchangeApi";
import { cn } from "@/lib/utils";
import { getCurrentUserIdFromToken } from "@/utils/authToken";
import { formatRelativeDate, getRequestStatusTone, panelClass, sectionClass } from "./shared";
import { GlobalLearningRequestModal } from "./GlobalLearningRequestModal";

const getUserName = (value: string | { _id: string; fullName?: string } | null | undefined, fallback = "User") =>
  typeof value === "string" ? fallback : value?.fullName || fallback;

export function GlobalLearningRequestsPage() {
  const currentUserId = getCurrentUserIdFromToken();
  const [tab, setTab] = useState<"community" | "mine">("community");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [communityRequests, setCommunityRequests] = useState<GlobalLearningRequest[]>([]);
  const [myRequests, setMyRequests] = useState<GlobalLearningRequest[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [community, mine] = await Promise.all([
        getGlobalLearningRequests(),
        getMyGlobalLearningRequests(),
      ]);
      setCommunityRequests(community);
      setMyRequests(mine);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleRequests = useMemo(
    () => (tab === "community" ? communityRequests : myRequests),
    [communityRequests, myRequests, tab],
  );

  const onAccept = async (requestId: string) => {
    setSavingId(requestId);
    try {
      await acceptGlobalLearningRequest(requestId);
      toast.success("Learning request accepted. A direct request thread is now available.");
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingId("");
    }
  };

  const onCancel = async (requestId: string) => {
    setSavingId(requestId);
    try {
      await cancelGlobalLearningRequest(requestId);
      toast.success("Learning request cancelled.");
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-8">
      <div className={sectionClass}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,160,133,0.22)] bg-[rgba(22,160,133,0.08)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#7fe7d2]">
              <Sparkles className="h-3.5 w-3.5" />
              Community Learning Board
            </div>
            <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">Ask for help without proposing a trade first</h2>
            <p className="mt-2 text-sm text-[rgba(189,216,233,0.76)] md:text-base">
              Post a focused learning goal, notify matched mentors, and turn the first acceptance into a direct collaboration thread.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => setOpenCreate(true)}>Post Learning Request</Button>
          </div>
        </div>
      </div>

      <div className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
            {(["community", "mine"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  "rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition",
                  tab === value ? "bg-[rgba(22,160,133,0.16)] text-[#7fe7d2]" : "text-[rgba(189,216,233,0.62)]",
                )}
              >
                {value === "community" ? "Community feed" : "My requests"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[rgba(189,216,233,0.56)]">
            <span>{communityRequests.length} open requests</span>
            <span>{myRequests.filter((request) => request.status === "open").length} mine still open</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {visibleRequests.length === 0 ? (
          <div className={`${panelClass} p-10 text-center`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)]">
              <Users className="h-7 w-7 text-[rgba(189,216,233,0.45)]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">No learning requests here yet</h3>
            <p className="mt-2 text-sm text-[rgba(189,216,233,0.68)]">
              {tab === "community"
                ? "Matched requests will appear here when learners ask for help in your areas."
                : "Create your first community learning request to reach matched mentors."}
            </p>
          </div>
        ) : (
          visibleRequests.map((request) => {
            const creatorId = typeof request.createdBy === "string" ? request.createdBy : request.createdBy?._id;
            const isMine = creatorId === currentUserId;
            const isAccepted = request.status === "accepted";
            const acceptedTradeRoute = request.acceptedTradeRequestId?._id ? "/requests" : "";

            return (
              <div
                key={request._id}
                className="rounded-[30px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(15,20,46,0.96),rgba(10,14,39,0.92))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.45)]">
                        {isMine ? "Your request" : "Community request"}
                      </div>
                      <h3 className="mt-2 text-2xl font-black text-white">{request.goalTitle}</h3>
                      <p className="mt-2 text-sm text-[rgba(189,216,233,0.74)]">
                        {request.description || `Looking for guided support in ${request.skillWanted}.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-[rgba(189,216,233,0.72)]">
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        Skill: {request.skillWanted}
                      </div>
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {request.experienceLevel}
                      </div>
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {request.preferredDuration} mins
                      </div>
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {request.budgetCredits} credits
                      </div>
                      <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
                        {formatRelativeDate(request.createdAt)}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-[rgba(22,160,133,0.16)] bg-[rgba(22,160,133,0.06)] p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7fe7d2]">
                        Learner
                      </div>
                      <p className="mt-2 text-sm text-[rgba(189,216,233,0.82)]">
                        {getUserName(request.createdBy, "Learner")}
                      </p>
                      {request.acceptedBy && (
                        <p className="mt-2 text-sm text-[rgba(189,216,233,0.82)]">
                          Accepted by {getUserName(request.acceptedBy, "Mentor")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <div className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getRequestStatusTone(request.status)}`}>
                      {request.status}
                    </div>

                    {!isMine && request.status === "open" && (
                      <Button
                        onClick={() => onAccept(request._id)}
                        disabled={savingId === request._id}
                      >
                        {savingId === request._id ? "Accepting..." : "Accept & Start Thread"}
                      </Button>
                    )}

                    {isMine && request.status === "open" && (
                      <Button
                        variant="outline"
                        onClick={() => onCancel(request._id)}
                        disabled={savingId === request._id}
                      >
                        {savingId === request._id ? "Cancelling..." : "Cancel Request"}
                      </Button>
                    )}

                    {isAccepted && acceptedTradeRoute && (
                      <Link
                        to={acceptedTradeRoute}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(96,165,250,0.24)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-200 transition hover:bg-[rgba(96,165,250,0.08)]"
                      >
                        <Compass className="h-4 w-4" />
                        Open Direct Request
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <GlobalLearningRequestModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={load}
      />
    </div>
  );
}
