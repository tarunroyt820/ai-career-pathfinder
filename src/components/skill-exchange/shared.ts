export const sectionClass =
  "rounded-[28px] border border-[rgba(22,160,133,0.18)] bg-[linear-gradient(180deg,rgba(15,20,46,0.96),rgba(10,14,39,0.9))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:p-8";

export const panelClass =
  "rounded-3xl border border-[rgba(22,160,133,0.15)] bg-[rgba(255,255,255,0.03)] shadow-[0_10px_30px_rgba(0,0,0,0.16)]";

export const inputClass =
  "w-full rounded-2xl border border-[rgba(22,160,133,0.24)] bg-[rgba(8,12,32,0.92)] px-4 py-3 text-sm text-white outline-none placeholder:text-[rgba(189,216,233,0.38)] focus:border-[rgba(22,160,133,0.55)] focus:ring-2 focus:ring-[rgba(22,160,133,0.22)]";

export const skillOptions = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "System Design",
  "UI/UX",
  "Data Science",
  "Cloud",
  "DevOps",
  "Communication",
];

export const dayOptions = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const parseTrustFromReasons = (reasons: string[] = []): string => {
  const trustReason = reasons.find((reason) => reason.toLowerCase().includes("trust baseline"));
  if (!trustReason) return "N/A";
  const match = trustReason.match(/(\d+)/);
  return match ? `${match[1]}` : "N/A";
};

export const formatRelativeDate = (value?: string): string => {
  if (!value) return "Just now";

  const date = new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return "Just now";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / (1000 * 60)));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export const getNotificationRoute = (type: string): string => {
  if (type.includes("global_learning_request")) return "/learning-requests";
  if (type.includes("request")) return "/requests";
  if (type.includes("message")) return "/messages";
  if (type.includes("session") || type.includes("exchange") || type.includes("noshow")) return "/exchanges";
  if (type.includes("dispute")) return "/exchanges";
  return "/notifications";
};

export const getNotificationTone = (type: string): { dot: string; chip: string; label: string } => {
  if (type.includes("global_learning_request")) {
    return {
      dot: "bg-teal-300",
      chip: "bg-teal-500/12 text-teal-100 border border-teal-400/20",
      label: "Community",
    };
  }

  if (type.includes("request")) {
    return {
      dot: "bg-sky-400",
      chip: "bg-sky-500/12 text-sky-200 border border-sky-400/20",
      label: "Request",
    };
  }

  if (type.includes("message")) {
    return {
      dot: "bg-emerald-400",
      chip: "bg-emerald-500/12 text-emerald-200 border border-emerald-400/20",
      label: "Message",
    };
  }

  if (type.includes("match")) {
    return {
      dot: "bg-amber-400",
      chip: "bg-amber-500/12 text-amber-100 border border-amber-400/20",
      label: "Match",
    };
  }

  return {
    dot: "bg-violet-400",
    chip: "bg-violet-500/12 text-violet-100 border border-violet-400/20",
    label: "Update",
  };
};

export const getRequestStatusTone = (status: string): string => {
  switch (status) {
    case "accepted":
      return "bg-emerald-500/12 text-emerald-200 border border-emerald-400/20";
    case "declined":
      return "bg-rose-500/12 text-rose-200 border border-rose-400/20";
    case "countered":
      return "bg-amber-500/12 text-amber-100 border border-amber-400/20";
    case "expired":
      return "bg-slate-500/12 text-slate-300 border border-slate-400/20";
    default:
      return "bg-sky-500/12 text-sky-200 border border-sky-400/20";
  }
};
