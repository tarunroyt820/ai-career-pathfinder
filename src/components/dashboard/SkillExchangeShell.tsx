import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  Compass,
  MessageCircle,
  Repeat,
  Sparkles,
  TrendingUp,
  UserRoundPlus,
} from "lucide-react";

import { getCurrentUserIdFromToken } from "@/utils/authToken";
import {
  getAgreements,
  getGlobalLearningRequests,
  getMatches,
  getNotifications,
  getSkillProfile,
  getTradeRequests,
  NotificationItem,
  TradeRequest,
  Agreement,
  SkillProfile,
} from "@/services/skillExchangeApi";
import {
  formatRelativeDate,
  getNotificationRoute,
  getNotificationTone,
  getRequestStatusTone,
  panelClass,
  sectionClass,
} from "@/components/skill-exchange/shared";
import SearchProfiles from "@/components/skill-exchange/SearchProfiles";

type OverviewState = {
  profile: SkillProfile | null;
  matchesCount: number;
  globalLearningRequestsCount: number;
  agreements: Agreement[];
  sentRequests: TradeRequest[];
  receivedRequests: TradeRequest[];
  notifications: NotificationItem[];
};

const fallbackState: OverviewState = {
  profile: null,
  matchesCount: 0,
  globalLearningRequestsCount: 0,
  agreements: [],
  sentRequests: [],
  receivedRequests: [],
  notifications: [],
};

export function SkillExchangeShell() {
  const [state, setState] = useState<OverviewState>(fallbackState);
  const [loading, setLoading] = useState(true);

  const normalizeList = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const userId = getCurrentUserIdFromToken();
      const results = await Promise.allSettled([
        userId ? getSkillProfile(userId) : Promise.resolve(null),
        getMatches("", 1, 6),
        getAgreements(),
        getGlobalLearningRequests(),
        getTradeRequests("sent"),
        getTradeRequests("received"),
        getNotifications(),
      ]);

      const [
        profileResult,
        matchesResult,
        agreementsResult,
        globalLearningRequestsResult,
        sentRequestsResult,
        receivedRequestsResult,
        notificationsResult,
      ] = results;

      setState({
        profile: profileResult.status === "fulfilled" ? profileResult.value : null,
        matchesCount: matchesResult.status === "fulfilled" ? matchesResult.value.total || normalizeList(matchesResult.value.matches).length : 0,
        globalLearningRequestsCount: globalLearningRequestsResult.status === "fulfilled" ? normalizeList(globalLearningRequestsResult.value).length : 0,
        agreements: agreementsResult.status === "fulfilled" ? normalizeList(agreementsResult.value) : [],
        sentRequests: sentRequestsResult.status === "fulfilled" ? normalizeList(sentRequestsResult.value) : [],
        receivedRequests: receivedRequestsResult.status === "fulfilled" ? normalizeList(receivedRequestsResult.value) : [],
        notifications: notificationsResult.status === "fulfilled" ? normalizeList(notificationsResult.value) : [],
      });

      setLoading(false);
    };

    load();
  }, []);

  const unreadNotifications = Array.isArray(state.notifications) ? state.notifications.filter((item) => !item.read) : [];
  const activeAgreements = Array.isArray(state.agreements) ? state.agreements.filter((item) => item.status === "active") : [];
  const pendingReceived = Array.isArray(state.receivedRequests) ? state.receivedRequests.filter((item) => item.status === "pending") : [];
  const setupComplete = Boolean(state.profile?.skillsOffered.length && state.profile?.skillsWanted.length);

  const recommendedActions = useMemo(
    () =>
      [
        !setupComplete
          ? {
              title: "Complete your skill profile",
              description: "Add offered and wanted skills so matching can rank you correctly.",
              to: "/profile/skills",
              icon: UserRoundPlus,
            }
          : null,
        {
          title: "Explore fresh matches",
          description: "Review compatible people and send a skill trade proposal.",
          to: "/matches",
          icon: Compass,
        },
        {
          title: "Ask the community",
          description: "Post a learning goal and notify matched mentors without offering a skill first.",
          to: "/learning-requests",
          icon: Sparkles,
        },
        {
          title: "Handle open requests",
          description: "Accept, decline, or counter the proposals waiting on you.",
          to: "/requests",
          icon: Repeat,
        },
        {
          title: "Open your inbox",
          description: "Reply to partners across all active exchange threads.",
          to: "/messages",
          icon: MessageCircle,
        },
      ].filter(Boolean) as Array<{ title: string; description: string; to: string; icon: typeof Compass }>,
    [setupComplete],
  );

  const topNotifications = state.notifications.slice(0, 4);
  const recentRequests = [...pendingReceived, ...state.sentRequests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div className={sectionClass}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,160,133,0.22)] bg-[rgba(22,160,133,0.08)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#7fe7d2]">
              <Sparkles className="h-3.5 w-3.5" />
              Skill Exchange Hub
            </div>
            <div>
              <h2 className="text-3xl font-black text-white md:text-4xl">Run your exchange flow from one place</h2>
              <p className="mt-2 max-w-xl text-sm text-[rgba(189,216,233,0.78)] md:text-base">
                This Vite dashboard now uses the Grox-inspired layout while staying wired to the backend routes already living in your project.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Matches", value: state.matchesCount, accent: "text-sky-300", icon: Compass },
              { label: "Learning Board", value: state.globalLearningRequestsCount, accent: "text-teal-200", icon: Sparkles },
              { label: "Active Trades", value: activeAgreements.length, accent: "text-emerald-300", icon: CalendarClock },
              { label: "Pending Requests", value: pendingReceived.length, accent: "text-amber-200", icon: Repeat },
              { label: "Unread Alerts", value: unreadNotifications.length, accent: "text-violet-200", icon: Bell },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4">
                <item.icon className={`mb-3 h-5 w-5 ${item.accent}`} />
                <div className="text-2xl font-black text-white">{loading ? "..." : item.value}</div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(189,216,233,0.54)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Recommended next steps</h3>
              <p className="mt-1 text-sm text-[rgba(189,216,233,0.72)]">
                These actions line up with the backend flow you already built.
              </p>
            </div>
            <Link
              to="/matches"
              className="rounded-xl border border-[rgba(22,160,133,0.22)] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#7fe7d2] transition hover:bg-[rgba(22,160,133,0.08)]"
            >
              Open Matches
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recommendedActions.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(22,160,133,0.22)] hover:bg-[rgba(22,160,133,0.05)]"
              >
                <item.icon className="h-6 w-6 text-[#7fe7d2]" />
                <h4 className="mt-4 text-lg font-bold text-white">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-[rgba(189,216,233,0.74)]">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Profile readiness</h3>
              <p className="mt-1 text-sm text-[rgba(189,216,233,0.72)]">Your matching quality improves once setup is complete.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-[#7fe7d2]" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-[rgba(22,160,133,0.18)] bg-[rgba(22,160,133,0.06)] p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">Skill profile status</div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#7fe7d2]">
                  {setupComplete ? "Ready" : "Needs setup"}
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#16A085,#7fe7d2)]"
                  style={{ width: `${setupComplete ? 100 : 42}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[rgba(189,216,233,0.78)]">
                <div>Offered skills: {state.profile?.skillsOffered.length || 0}</div>
                <div>Wanted skills: {state.profile?.skillsWanted.length || 0}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="text-sm font-semibold text-white">Current bio</div>
              <p className="mt-2 text-sm leading-6 text-[rgba(189,216,233,0.72)]">
                {state.profile?.bio?.trim() || "No exchange bio yet. Add one so people understand what you can teach and what you want to learn."}
              </p>
              <Link
                to="/profile/skills"
                className="mt-4 inline-flex rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-[rgba(22,160,133,0.22)] hover:text-[#7fe7d2]"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Find people to trade with</h3>
              <p className="mt-1 text-sm text-[rgba(189,216,233,0.72)]">Search by name or skill to start a proposal quickly.</p>
            </div>
          </div>

          <div className="mt-6">
            <SearchProfiles />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Recent requests</h3>
              <p className="mt-1 text-sm text-[rgba(189,216,233,0.72)]">Incoming and sent proposals pulled from your live request routes.</p>
            </div>
            <Link
              to="/requests"
              className="rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-[rgba(22,160,133,0.22)] hover:text-[#7fe7d2]"
            >
              Manage
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[rgba(255,255,255,0.1)] px-5 py-10 text-center text-sm text-[rgba(189,216,233,0.62)]">
                No trade requests yet. Start from the matches page to send your first proposal.
              </div>
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex flex-col gap-3 rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      {typeof request.from === "string" ? "Unknown" : request.from.fullName || "Unknown"} to{" "}
                      {typeof request.to === "string" ? "Unknown" : request.to.fullName || "Unknown"}
                    </div>
                    <div className="mt-1 text-sm text-[rgba(189,216,233,0.74)]">
                      {request.offeredSkill} for {request.requestedSkill}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[rgba(189,216,233,0.44)]">
                      {request.proposedDuration} mins • {request.proposedCredits} credits • {formatRelativeDate(request.createdAt)}
                    </div>
                  </div>

                  <div className={`w-fit rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getRequestStatusTone(request.status)}`}>
                    {request.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Notification feed</h3>
              <p className="mt-1 text-sm text-[rgba(189,216,233,0.72)]">Recent exchange events from the current notification routes.</p>
            </div>
            <Link
              to="/notifications"
              className="rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-[rgba(22,160,133,0.22)] hover:text-[#7fe7d2]"
            >
              View All
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {topNotifications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[rgba(255,255,255,0.1)] px-5 py-10 text-center text-sm text-[rgba(189,216,233,0.62)]">
                No notifications yet.
              </div>
            ) : (
              topNotifications.map((notification) => {
                const tone = getNotificationTone(notification.type);

                return (
                  <Link
                    key={notification._id}
                    to={getNotificationRoute(notification.type)}
                    className="block rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-5 transition hover:border-[rgba(22,160,133,0.22)] hover:bg-[rgba(22,160,133,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${tone.chip}`}>
                            {tone.label}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white">{notification.message}</p>
                      </div>

                      {!notification.read && <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#7fe7d2]" />}
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[rgba(189,216,233,0.44)]">
                      {formatRelativeDate(notification.createdAt)}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
