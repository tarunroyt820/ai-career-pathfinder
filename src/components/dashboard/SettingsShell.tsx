import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Crown,
  Eye,
  Globe,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/common/Button";
import PushNotificationSettings from "@/components/settings/PushNotificationSettings";
import { EnhancedProfile } from "@/types/enhancedProfile";
import {
  getEnhancedProfile,
  updateEnhancedProfile,
} from "@/services/enhancedProfileApi";
import { deleteAccount, uploadProfilePhoto } from "@/services/profileApi";
import { deleteHistory as deleteAIHistory } from "@/services/aiApi";

type TabId = "profile" | "upgrade" | "notifications" | "account" | "privacy";

type ToggleState = {
  aiProgressAlerts: boolean;
  skillExchangeMatches: boolean;
  securityActivity: boolean;
  publicProfile: boolean;
  aiTraining: boolean;
  twoFactorAuth: boolean;
};

const tabs: { id: TabId; label: string; icon: typeof User; badge?: string }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "upgrade", label: "Upgrade", icon: Crown, badge: "Pro" },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Mail },
  { id: "privacy", label: "Privacy", icon: Shield },
];

const initialToggles: ToggleState = {
  aiProgressAlerts: true,
  skillExchangeMatches: false,
  securityActivity: true,
  publicProfile: true,
  aiTraining: false,
  twoFactorAuth: true,
};

const listToComma = (value?: string[]) => value?.join(", ") || "";
const commaToList = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

const getInitials = (name?: string) =>
  name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "NA";

const computeProfileCompleteness = (profile: EnhancedProfile) => {
  const checks = [
    profile.fullName,
    profile.jobTitle,
    profile.experienceLevel,
    profile.skills.length > 0 ? "skills" : "",
    profile.careerGoal,
    profile.targetRole,
    profile.yearsOfExperience,
    profile.preferredIndustry,
    profile.workPreference,
    profile.portfolioUrl,
    profile.tools.length > 0 ? "tools" : "",
    profile.aiSummary,
  ];

  const completed = checks.filter(Boolean).length;
  return {
    completed,
    total: checks.length,
    percentage: Math.round((completed / checks.length) * 100),
  };
};

export function SettingsShell() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EnhancedProfile | null>(null);
  const [savedProfile, setSavedProfile] = useState<EnhancedProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingChats, setIsDeletingChats] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [toggles, setToggles] = useState<ToggleState>(initialToggles);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getEnhancedProfile().then((data) => {
      setProfile(data);
      setSavedProfile(data);
    });
  }, []);

  const isDirty = useMemo(() => {
    if (!profile || !savedProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(savedProfile);
  }, [profile, savedProfile]);

  const profileCompleteness = useMemo(
    () => (profile ? computeProfileCompleteness(profile) : null),
    [profile],
  );

  const handleFieldChange = (
    field: keyof EnhancedProfile,
    value: string | string[],
  ) => {
    setProfile((current) => (current ? { ...current, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const saved = await updateEnhancedProfile(profile);
      setProfile(saved);
      setSavedProfile(saved);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!savedProfile) return;
    setProfile(savedProfile);
    toast.message("Unsaved changes discarded");
  };

  const toggleValue = (key: keyof ToggleState) => {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  };

  const getPhotoUrl = (photoUrl?: string) => {
    if (!photoUrl) return "";
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${base}${photoUrl}`;
  };

  const handlePhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const updated = await uploadProfilePhoto(file);
      setProfile((current) =>
        current ? { ...current, profilePhotoUrl: updated.profilePhotoUrl || "" } : current,
      );
      setSavedProfile((current) =>
        current ? { ...current, profilePhotoUrl: updated.profilePhotoUrl || "" } : current,
      );
      toast.success("Profile photo updated");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to upload photo";
      toast.error(message);
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const clearAuthSession = () => {
    localStorage.removeItem("nextro_token");
    localStorage.removeItem("nextro_refresh_token");
  };

  const handleDeleteChats = async () => {
    const confirmed = window.confirm(
      "Delete all AI Assistant chats? This removes only assistant conversation history and cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeletingChats(true);
    try {
      const result = await deleteAIHistory();
      toast.success(
        result.deletedCount > 0
          ? `Deleted ${result.deletedCount} AI chat message${result.deletedCount === 1 ? "" : "s"}.`
          : "No saved AI chats were found.",
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete AI chat history";
      toast.error(message);
    } finally {
      setIsDeletingChats(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your profile, AI chats, career plans, and related data. This cannot be undone.",
    );

    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount();
      clearAuthSession();
      toast.success(result.message || "Account deleted successfully");
      navigate("/login", { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete account";
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!profile || !profileCompleteness) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const memberSince =
    profile.fullName && profile.email
      ? "Member since February 2026"
      : "Complete your profile to get started";

  const fieldBaseClass =
    "w-full rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[rgba(115,195,255,0.6)] focus:ring-4 focus:ring-[rgba(115,195,255,0.10)]";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-[0.12em] text-[rgba(189,216,233,0.72)]";
  const hintClass = "text-[11px] text-[rgba(189,216,233,0.45)]";

  return (
    <div className="animate-in space-y-5 fade-in duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            System Settings
          </h2>
          <p className="mt-1 text-sm font-medium text-[rgba(189,216,233,0.72)] md:text-base">
            Control your Nextaro experience and data.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-[rgba(255,255,255,0.14)] px-5 font-semibold"
            onClick={handleDiscard}
            disabled={!isDirty}
          >
            Discard
          </Button>
          <Button
            className="h-11 rounded-xl px-6 font-black uppercase tracking-widest"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(115,195,255,0.35)] bg-[rgba(25,80,132,0.22)] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(115,195,255,0.9)] text-[#0f2340]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#9fd0ff]">
              Unlock Pro - supercharge your AI profile
            </p>
            <p className="mt-1 text-xs text-[rgba(159,208,255,0.78)]">
              AI resume scoring, unlimited job matches, priority recommendations,
              and career analytics.
            </p>
          </div>
        </div>
        <Button
          className="h-10 rounded-xl bg-[#78b8f5] px-5 text-xs font-black uppercase tracking-widest text-[#10223c] hover:bg-[#90c6f8]"
          onClick={() => setActiveTab("upgrade")}
        >
          Upgrade To Pro
        </Button>
      </div>

      {isDirty && (
        <div className="flex flex-col gap-3 rounded-xl border border-[rgba(239,159,39,0.42)] bg-[rgba(239,159,39,0.12)] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#efc176]">
            <AlertTriangle className="h-4 w-4" />
            You have unsaved changes
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-lg border-[rgba(239,159,39,0.45)] px-4 text-[#efc176]"
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button
              className="h-9 rounded-lg bg-[#ef9f27] px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-[#f2ab3f]"
              onClick={handleSave}
              disabled={isSaving}
            >
              Save Now
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-[rgba(255,255,255,0.08)] text-white"
                  : "text-[rgba(189,216,233,0.58)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-auto rounded-full bg-[rgba(239,159,39,0.18)] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#efc176]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === "profile" && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,16,40,0.72)]">
              <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-4">
                <h3 className="text-lg font-bold">Professional Identity</h3>
                <p className="mt-1 text-sm text-[rgba(189,216,233,0.68)]">
                  Your public persona on the Nextaro network.
                </p>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[rgba(115,195,255,0.12)] text-lg font-black text-[#9fd0ff]">
                    {profile.profilePhotoUrl ? (
                      <img
                        src={getPhotoUrl(profile.profilePhotoUrl)}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(profile.fullName)
                    )}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      {profile.fullName || "Nextaro User"}
                    </p>
                    <p className="text-sm text-[rgba(189,216,233,0.62)]">
                      {memberSince}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[rgba(139,201,93,0.14)] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#9ed96d]">
                        Verified Profile
                      </span>
                      <span className="rounded-full bg-[rgba(115,195,255,0.14)] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#9fd0ff]">
                        Elite Network
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] px-4 text-sm text-[rgba(189,216,233,0.72)] transition hover:bg-[rgba(255,255,255,0.04)]"
                  >
                    <Upload className="h-4 w-4" />
                    Change photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>

                <div className="rounded-xl bg-[rgba(255,255,255,0.04)] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-[rgba(189,216,233,0.72)]">
                    <span>Profile completeness</span>
                    <span className="font-bold text-[#9fd0ff]">
                      {profileCompleteness.completed} / {profileCompleteness.total} fields
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                    <div
                      className="h-full rounded-full bg-[#73c3ff]"
                      style={{ width: `${profileCompleteness.percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[rgba(189,216,233,0.45)]">
                    Add tools, certifications, and AI summary to unlock better job matches.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Display Name</label>
                    <input
                      className={fieldBaseClass}
                      value={profile.fullName}
                      onChange={(event) =>
                        handleFieldChange("fullName", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Professional Title</label>
                    <input
                      className={fieldBaseClass}
                      placeholder="e.g. Senior Frontend Engineer"
                      value={profile.jobTitle || ""}
                      onChange={(event) =>
                        handleFieldChange("jobTitle", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Expertise Level</label>
                    <select
                      className={fieldBaseClass}
                      value={profile.experienceLevel || "beginner"}
                      onChange={(event) =>
                        handleFieldChange("experienceLevel", event.target.value)
                      }
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Primary Skills</label>
                    <input
                      className={fieldBaseClass}
                      placeholder="e.g. React, Node.js, SQL"
                      value={listToComma(profile.skills)}
                      onChange={(event) =>
                        handleFieldChange("skills", commaToList(event.target.value))
                      }
                    />
                    <p className={hintClass}>Separate with commas</p>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className={labelClass}>Mission Statement</label>
                    <textarea
                      className={`${fieldBaseClass} min-h-[90px] resize-y`}
                      placeholder="What drives your professional engine?"
                      value={profile.careerGoal}
                      onChange={(event) =>
                        handleFieldChange("careerGoal", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="border-t border-[rgba(255,255,255,0.08)] pt-5">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[rgba(189,216,233,0.6)]">
                    AI Career Context
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Target Role</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="e.g. Backend Engineer"
                        value={profile.targetRole}
                        onChange={(event) =>
                          handleFieldChange("targetRole", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Years Of Experience</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="e.g. 3 years"
                        value={profile.yearsOfExperience}
                        onChange={(event) =>
                          handleFieldChange("yearsOfExperience", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Preferred Industry</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="e.g. Fintech, SaaS"
                        value={profile.preferredIndustry}
                        onChange={(event) =>
                          handleFieldChange("preferredIndustry", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Work Preference</label>
                      <select
                        className={fieldBaseClass}
                        value={profile.workPreference || ""}
                        onChange={(event) =>
                          handleFieldChange("workPreference", event.target.value)
                        }
                      >
                        <option value="">Select work mode</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-site</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Portfolio URL</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="https://portfolio.example"
                        value={profile.portfolioUrl}
                        onChange={(event) =>
                          handleFieldChange("portfolioUrl", event.target.value)
                        }
                      />
                      <p className={hintClass}>Must start with https://</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>LinkedIn URL</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="https://linkedin.com/in/..."
                        value={profile.linkedinUrl}
                        onChange={(event) =>
                          handleFieldChange("linkedinUrl", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>GitHub URL</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="https://github.com/..."
                        value={profile.githubUrl}
                        onChange={(event) =>
                          handleFieldChange("githubUrl", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Preferred Location</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="e.g. Bangalore, Remote India"
                        value={profile.preferredLocation}
                        onChange={(event) =>
                          handleFieldChange("preferredLocation", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Tools</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="e.g. Docker, AWS, Postman"
                        value={listToComma(profile.tools)}
                        onChange={(event) =>
                          handleFieldChange("tools", commaToList(event.target.value))
                        }
                      />
                      <p className={hintClass}>Separate with commas</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Certifications</label>
                      <input
                        className={fieldBaseClass}
                        placeholder="e.g. AWS CCP, Google Analytics"
                        value={listToComma(profile.certifications)}
                        onChange={(event) =>
                          handleFieldChange(
                            "certifications",
                            commaToList(event.target.value),
                          )
                        }
                      />
                      <p className={hintClass}>Separate with commas</p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={labelClass}>AI Summary</label>
                      <textarea
                        className={`${fieldBaseClass} min-h-[96px] resize-y`}
                        placeholder="Describe your current direction, what role you want, and what the AI should optimize for."
                        value={profile.aiSummary}
                        onChange={(event) =>
                          handleFieldChange("aiSummary", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "upgrade" && (
            <>
              <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,16,40,0.72)]">
                <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-4">
                  <h3 className="text-lg font-bold">Choose Your Plan</h3>
                  <p className="mt-1 text-sm text-[rgba(189,216,233,0.68)]">
                    Upgrade anytime. Cancel or downgrade from account settings.
                  </p>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-3">
                  {[
                    {
                      name: "Free",
                      price: "Rs 0",
                      desc: "Basic profile · 5 job matches / week · Standard AI suggestions",
                      button: "Current Plan",
                      disabled: true,
                    },
                    {
                      name: "Pro",
                      price: "Rs 499",
                      desc: "AI resume scoring · Unlimited matches · Priority recommendations · Career analytics",
                      button: "Upgrade To Pro",
                      featured: true,
                    },
                    {
                      name: "Elite",
                      price: "Rs 999",
                      desc: "Everything in Pro · 1:1 career coach · Interview prep · Salary negotiation tools",
                      button: "Learn More",
                    },
                  ].map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative rounded-xl border p-4 ${
                        plan.featured
                          ? "border-[rgba(115,195,255,0.7)] bg-[rgba(25,80,132,0.18)]"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"
                      }`}
                    >
                      {plan.featured && (
                        <span className="absolute right-4 top-0 rounded-b-lg bg-[rgba(239,159,39,0.18)] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#efc176]">
                          Most Popular
                        </span>
                      )}
                      <p className="text-sm font-bold">{plan.name}</p>
                      <p className="mt-2 text-3xl font-black">
                        {plan.price}{" "}
                        <span className="text-sm font-medium text-[rgba(189,216,233,0.62)]">
                          / mo
                        </span>
                      </p>
                      <p className="mt-3 text-xs leading-6 text-[rgba(189,216,233,0.68)]">
                        {plan.desc}
                      </p>
                      <Button
                        className={`mt-4 h-10 w-full rounded-xl text-xs font-black uppercase tracking-widest ${
                          plan.featured
                            ? "bg-white text-[#10223c] hover:bg-[rgba(255,255,255,0.88)]"
                            : ""
                        }`}
                        variant={plan.featured ? "default" : "outline"}
                        disabled={plan.disabled}
                      >
                        {plan.button}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,16,40,0.72)]">
                <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-4">
                  <h3 className="text-lg font-bold">What You Unlock With Pro</h3>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  {[
                    [
                      "AI resume scoring",
                      "Get a score and actionable feedback on your resume vs your target role.",
                    ],
                    [
                      "Unlimited job matches",
                      "See every relevant match in real time without weekly caps.",
                    ],
                    [
                      "Career analytics",
                      "Track profile views, application status, and skill-gap trends.",
                    ],
                    [
                      "Priority recommendations",
                      "Your profile is surfaced first to recruiters in your target role.",
                    ],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="rounded-xl bg-[rgba(255,255,255,0.04)] p-4"
                    >
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-1 text-sm text-[rgba(189,216,233,0.68)]">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,16,40,0.72)]">
              <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-4">
                <h3 className="text-lg font-bold">Alert Configuration</h3>
                <p className="mt-1 text-sm text-[rgba(189,216,233,0.68)]">
                  Manage how you receive real-time updates.
                </p>
              </div>
              <div className="p-6">
                {[
                  {
                    key: "aiProgressAlerts" as const,
                    title: "AI progress alerts",
                    desc: "When AI discovers a new career milestone for you.",
                    icon: Zap,
                  },
                  {
                    key: "skillExchangeMatches" as const,
                    title: "Skill exchange matches",
                    desc: "Real-time alerts when a high-priority skill match is found.",
                    icon: RefreshCw,
                  },
                  {
                    key: "securityActivity" as const,
                    title: "Security & login activity",
                    desc: "Important updates regarding your account security.",
                    icon: Lock,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.04)] text-[rgba(189,216,233,0.7)]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.title}</p>
                        <p className="text-sm text-[rgba(189,216,233,0.62)]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-pressed={toggles[item.key]}
                      onClick={() => toggleValue(item.key)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        toggles[item.key]
                          ? "bg-[#73c3ff]"
                          : "bg-[rgba(255,255,255,0.18)]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          toggles[item.key] ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-[rgba(239,159,39,0.42)] bg-[rgba(239,159,39,0.12)] p-4 text-[#efc176]">
                  <Star className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    <strong>Pro feature:</strong> Weekly digest emails and recruiter
                    view alerts are available on the Pro plan.
                  </p>
                </div>

                <div className="mt-5">
                  <PushNotificationSettings />
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <>
              <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,16,40,0.72)]">
                <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-4">
                  <h3 className="text-lg font-bold">Account Information</h3>
                  <p className="mt-1 text-sm text-[rgba(189,216,233,0.68)]">
                    Read-only. Contact your admin to change email or plan.
                  </p>
                </div>
                <div className="space-y-4 p-6">
                  {[
                    ["Email", profile.email || "Not available"],
                    ["Current plan", "Free"],
                    ["Member since", "February 2026"],
                    ["Account status", "Active"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-2 text-sm last:border-b-0"
                    >
                      <span className="text-[rgba(189,216,233,0.62)]">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[rgba(226,75,74,0.38)] bg-[rgba(90,19,22,0.18)]">
                <div className="border-b border-[rgba(226,75,74,0.38)] bg-[rgba(226,75,74,0.08)] px-6 py-4">
                  <h3 className="text-lg font-bold text-[#f09595]">Danger Zone</h3>
                  <p className="mt-1 text-sm text-[rgba(240,149,149,0.76)]">
                    Irreversible actions. Proceed with caution.
                  </p>
                </div>
                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Delete AI assistant chats</p>
                    <p className="mt-1 text-sm text-[rgba(189,216,233,0.62)]">
                      Remove only your saved AI Assistant conversation history.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl border-[rgba(239,159,39,0.48)] px-5 text-[#efc176]"
                    onClick={handleDeleteChats}
                    disabled={isDeletingChats || isDeletingAccount}
                  >
                    {isDeletingChats ? "Deleting Chats..." : "Delete AI Chats"}
                  </Button>
                </div>
                <div className="mx-6 border-t border-[rgba(226,75,74,0.22)]" />
                <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Delete account</p>
                    <p className="mt-1 text-sm text-[rgba(189,216,233,0.62)]">
                      Permanently remove your profile, data, and matches.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl border-[rgba(226,75,74,0.48)] px-5 text-[#f09595]"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || isDeletingChats}
                  >
                    {isDeletingAccount ? "Deleting Account..." : "Delete Account"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === "privacy" && (
            <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,16,40,0.72)]">
              <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-4">
                <h3 className="text-lg font-bold">Privacy & Visibility</h3>
                <p className="mt-1 text-sm text-[rgba(189,216,233,0.68)]">
                  Control who can see your profile and data.
                </p>
              </div>
              <div className="p-6">
                {[
                  {
                    key: "publicProfile" as const,
                    title: "Public profile",
                    desc: "Make your profile discoverable by recruiters.",
                    icon: Eye,
                  },
                  {
                    key: "aiTraining" as const,
                    title: "Share data for AI training",
                    desc: "Help improve AI recommendations with anonymised data.",
                    icon: Globe,
                  },
                  {
                    key: "twoFactorAuth" as const,
                    title: "Two-factor authentication",
                    desc: "Require OTP at every login for extra security.",
                    icon: Shield,
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.04)] text-[rgba(189,216,233,0.7)]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.title}</p>
                        <p className="text-sm text-[rgba(189,216,233,0.62)]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-pressed={toggles[item.key]}
                      onClick={() => toggleValue(item.key)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        toggles[item.key]
                          ? "bg-[#73c3ff]"
                          : "bg-[rgba(255,255,255,0.18)]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          toggles[item.key] ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
