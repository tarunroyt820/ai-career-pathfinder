import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  Compass,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getCurrentUserIdFromToken } from "@/utils/authToken";
import {
  createTradeRequest,
  getMatches,
  getSkillProfile,
  MatchCard,
  ProficiencyLevel,
  SkillProfile,
} from "@/services/skillExchangeApi";
import { inputClass, panelClass, parseTrustFromReasons, sectionClass } from "./shared";

const levelOptions: Array<{ label: string; value: "all" | ProficiencyLevel }> = [
  { label: "All Levels", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "Expert", value: "expert" },
];

type DraftRequest = {
  offeredSkill: string;
  requestedSkill: string;
  proposedCredits: number;
  proposedDuration: number;
  message: string;
};

const defaultDraft: DraftRequest = {
  offeredSkill: "",
  requestedSkill: "",
  proposedCredits: 2,
  proposedDuration: 60,
  message: "",
};

export function SkillMatchesPage() {
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | ProficiencyLevel>("all");
  const [currentProfile, setCurrentProfile] = useState<SkillProfile | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchCard | null>(null);
  const [draftRequest, setDraftRequest] = useState<DraftRequest>(defaultDraft);
  const [sending, setSending] = useState(false);

  const load = useCallback(async (skill = searchQuery) => {
    setLoading(true);
    try {
      const result = await getMatches(skill, 1, 12);
      setMatches(result.matches || []);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const loadProfile = async () => {
      const userId = getCurrentUserIdFromToken();
      if (!userId) return;

      try {
        const profile = await getSkillProfile(userId);
        setCurrentProfile(profile);
      } catch {
        setCurrentProfile(null);
      }
    };

    loadProfile();
    load("");
  }, [load]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (typeof match.userId !== "string" && (match.userId.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())) ||
        match.skillsOffered.some((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        match.skillsWanted.some((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLevel =
        levelFilter === "all" ||
        match.skillsOffered.some((skill) => skill.proficiencyLevel === levelFilter);

      return matchesSearch && matchesLevel;
    });
  }, [levelFilter, matches, searchQuery]);

  const openTradeModal = (match: MatchCard) => {
    const firstOfferedSkill = currentProfile?.skillsOffered?.[0]?.name || "";
    const firstRequestedSkill = match.skillsOffered[0]?.name || "";

    setSelectedMatch(match);
    setDraftRequest({
      offeredSkill: firstOfferedSkill,
      requestedSkill: firstRequestedSkill,
      proposedCredits: 2,
      proposedDuration: 60,
      message: firstRequestedSkill
        ? `Hi, I'd love to learn ${firstRequestedSkill} from you and exchange one of my skills in return.`
        : "",
    });
  };

  const submitTradeRequest = async () => {
    if (!selectedMatch || typeof selectedMatch.userId === "string") return;
    if (!draftRequest.offeredSkill || !draftRequest.requestedSkill) {
      toast.error("Choose both an offered skill and a requested skill.");
      return;
    }

    setSending(true);
    try {
      await createTradeRequest({
        to: selectedMatch.userId._id,
        offeredSkill: draftRequest.offeredSkill,
        requestedSkill: draftRequest.requestedSkill,
        proposedCredits: Number(draftRequest.proposedCredits),
        proposedDuration: Number(draftRequest.proposedDuration),
        message: draftRequest.message.trim() || undefined,
      });

      toast.success("Trade proposal sent.");
      setSelectedMatch(null);
      setDraftRequest(defaultDraft);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={sectionClass}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(22,160,133,0.22)] bg-[rgba(22,160,133,0.08)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#7fe7d2]">
              <Compass className="h-3.5 w-3.5" />
              Live Match Feed
            </div>
            <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">Find people whose skills fit your exchange goals</h2>
            <p className="mt-2 text-sm text-[rgba(189,216,233,0.76)] md:text-base">
              This screen keeps the Grox match layout, but it now runs on your existing `/api/matches` and `/api/requests` routes.
            </p>
          </div>

          <button
            onClick={() => load(searchQuery)}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-[rgba(22,160,133,0.22)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[rgba(22,160,133,0.08)] disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh Matches
          </button>
        </div>
      </div>

      <div className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(189,216,233,0.4)]" />
            <input
              className={cn(inputClass, "pl-11")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or skill"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(189,216,233,0.4)]" />
              <select
                className={cn(inputClass, "min-w-[180px] pl-11")}
                value={levelFilter}
                onChange={(event) => setLevelFilter(event.target.value as "all" | ProficiencyLevel)}
              >
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => load(searchQuery)}
              className="rounded-2xl bg-[linear-gradient(135deg,#16A085,#12796d)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(22,160,133,0.22)] transition hover:opacity-95"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`${panelClass} flex min-h-[280px] items-center justify-center p-10 text-sm text-[rgba(189,216,233,0.7)]`}>
          Scanning the network for exchange matches...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className={`${panelClass} p-10 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)]">
            <Search className="h-7 w-7 text-[rgba(189,216,233,0.45)]" />
          </div>
          <h3 className="mt-5 text-xl font-bold text-white">No matches found</h3>
          <p className="mt-2 text-sm text-[rgba(189,216,233,0.68)]">Try another skill keyword or complete your exchange profile first.</p>
          <div className="mt-6">
            <Link
              to="/profile/skills"
              className="rounded-2xl border border-[rgba(22,160,133,0.22)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#7fe7d2] transition hover:bg-[rgba(22,160,133,0.08)]"
            >
              Setup Profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {filteredMatches.map((match) => {
            const trust = parseTrustFromReasons(match.matchReasons);
            const displayName = typeof match.userId === "string" ? "Unknown User" : match.userId.fullName || "Unknown User";

            return (
              <div
                key={match._id}
                className="rounded-[30px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(15,20,46,0.96),rgba(10,14,39,0.92))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-[rgba(22,160,133,0.2)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-2xl font-black text-white">{displayName}</h3>
                      <ShieldCheck className="h-5 w-5 text-sky-300" />
                    </div>
                    <p className="mt-1 text-sm text-[rgba(189,216,233,0.76)]">
                      Looking to learn {match.skillsWanted.map((skill) => skill.name).join(", ") || "new skills"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-3xl font-black text-[#7fe7d2]">{match.matchScore}%</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[rgba(189,216,233,0.45)]">Match</div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-[rgba(22,160,133,0.14)] bg-[rgba(22,160,133,0.06)] p-4">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#7fe7d2]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Why this match works
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-[rgba(189,216,233,0.78)]">
                    {match.matchReasons.slice(0, 3).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">Offering to teach</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.skillsOffered.map((skill) => (
                        <span
                          key={skill.name}
                          className="rounded-full border border-[rgba(22,160,133,0.2)] bg-[rgba(22,160,133,0.08)] px-3 py-1 text-xs font-bold text-white"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">Wants to learn</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.skillsWanted.map((skill) => (
                        <span
                          key={skill.name}
                          className="rounded-full border border-[rgba(96,165,250,0.22)] bg-[rgba(96,165,250,0.08)] px-3 py-1 text-xs font-bold text-white"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[rgba(189,216,233,0.74)]">
                  <div className="rounded-full border border-[rgba(255,255,255,0.07)] px-3 py-1">Trust {trust}%</div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.07)] px-3 py-1">
                    <Star className="h-3.5 w-3.5 text-amber-300" />
                    Smart-ranked
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={() => openTradeModal(match)}
                    disabled={!currentProfile?.skillsOffered.length}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#16A085,#12796d)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(22,160,133,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Propose Trade
                  </button>

                  <Link
                    to={`/profile/${typeof match.userId === "string" ? "" : match.userId._id}`}
                    className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-5 py-3 text-sm font-bold text-white transition hover:border-[rgba(22,160,133,0.2)] hover:text-[#7fe7d2]"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(1,4,18,0.82)] px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-[rgba(22,160,133,0.2)] bg-[linear-gradient(180deg,rgba(15,20,46,0.98),rgba(10,14,39,0.97))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7fe7d2]">Trade proposal</div>
                <h3 className="mt-2 text-2xl font-black text-white">
                  Send a request to {typeof selectedMatch.userId === "string" ? "this user" : selectedMatch.userId.fullName || "this user"}
                </h3>
                <p className="mt-2 text-sm text-[rgba(189,216,233,0.72)]">
                  This uses your existing request creation route, so the proposal goes straight into the real workflow.
                </p>
              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                className="rounded-xl border border-[rgba(255,255,255,0.08)] p-2 text-[rgba(189,216,233,0.7)] transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                  What you offer
                </label>
                <select
                  className={inputClass}
                  value={draftRequest.offeredSkill}
                  onChange={(event) => setDraftRequest((current) => ({ ...current, offeredSkill: event.target.value }))}
                >
                  <option value="">Select your skill</option>
                  {(currentProfile?.skillsOffered || []).map((skill) => (
                    <option key={skill.name} value={skill.name}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                  What you want
                </label>
                <select
                  className={inputClass}
                  value={draftRequest.requestedSkill}
                  onChange={(event) => setDraftRequest((current) => ({ ...current, requestedSkill: event.target.value }))}
                >
                  <option value="">Select their skill</option>
                  {selectedMatch.skillsOffered.map((skill) => (
                    <option key={skill.name} value={skill.name}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                  Credits
                </label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={draftRequest.proposedCredits}
                  onChange={(event) =>
                    setDraftRequest((current) => ({ ...current, proposedCredits: Number(event.target.value) || 1 }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                  Duration in minutes
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  className={inputClass}
                  value={draftRequest.proposedDuration}
                  onChange={(event) =>
                    setDraftRequest((current) => ({ ...current, proposedDuration: Number(event.target.value) || 60 }))
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.2em] text-[rgba(189,216,233,0.5)]">
                Personal message
              </label>
              <textarea
                rows={4}
                className={inputClass}
                value={draftRequest.message}
                onChange={(event) => setDraftRequest((current) => ({ ...current, message: event.target.value }))}
                placeholder="Add context so the other person understands why this trade is a good fit."
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setSelectedMatch(null)}
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] px-5 py-3 text-sm font-bold text-white transition hover:border-[rgba(22,160,133,0.2)]"
              >
                Cancel
              </button>
              <button
                onClick={submitTradeRequest}
                disabled={sending}
                className="rounded-2xl bg-[linear-gradient(135deg,#16A085,#12796d)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(22,160,133,0.24)] transition hover:opacity-95 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
