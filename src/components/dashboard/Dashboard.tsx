import { Button } from "@/components/common/Button";
import {
  BookOpen,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Settings,
  User,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { OverviewShell } from "./OverviewShell";
import { CareerPathShell } from "./CareerPathShell";
import { LearningShell } from "./LearningShell";
import { SkillExchangeShell } from "./SkillExchangeShell";
import { AIAssistantShell } from "./AIAssistantShell";
import { SettingsShell } from "./SettingsShell";
import Profile from "./Profile";
import logo from "@/assets/images/nextaro-logo.png";
import { getProfile } from "@/services/profileApi";
import { UserProfile } from "@/types/profile";

interface DashboardProps {
  onNavigate: (view: "landing" | "login" | "signup" | "dashboard") => void;
}

const navItems = [
  { icon: Home, label: "Overview", id: "overview" },
  { icon: Compass, label: "Career Path", id: "career" },
  { icon: BookOpen, label: "Learning", id: "learning" },
  { icon: RefreshCw, label: "Skill Exchange", id: "skills" },
  { icon: MessageSquare, label: "AI Assistant", id: "assistant" },
  { icon: Settings, label: "Settings", id: "settings" },
  { icon: User, label: "Profile", id: "profile" },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Dashboard: Error fetching profile", error);
      }
    };
    fetchProfile();
  }, []);

  // Helper to get initials
  const getInitials = (name: string) => {
    if (!name) return "JD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewShell />;
      case "career":
        return <CareerPathShell />;
      case "learning":
        return <LearningShell />;
      case "skills":
        return <SkillExchangeShell />;
      case "assistant":
        return <AIAssistantShell />;
      case "settings":
        return <SettingsShell />;
      case "profile":
        return <Profile />;
      default:
        return <OverviewShell />;
    }
  };

  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-border/50 bg-card lg:flex">
        <div className="flex h-20 items-center gap-2 border-b border-border/50 px-6">
          <img
            src={logo}
            alt="Nextaro Logo"
            className="h-10 w-auto"
          />
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/50 p-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate("landing")}
            className="w-full justify-start gap-3 rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-card shadow-2xl transition-transform lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-border/50 px-6">
          <img
            src={logo}
            alt="Nextaro Logo"
            className="h-10 w-auto"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border/50 p-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate("landing")}
            className="w-full justify-start gap-3 rounded-2xl text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-20 items-center justify-between border-b border-border/50 bg-card px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Welcome back, {profile.fullName.split(" ")[0] || "User"}
              </h1>
              <p className="text-sm text-muted-foreground">Track your career progress</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {getInitials(profile.fullName)}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
