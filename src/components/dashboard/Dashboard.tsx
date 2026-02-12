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
import { Routes, Route, NavLink, useNavigate, Navigate, Link } from "react-router-dom";
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
import { logout } from "@/services/authApi";

const navItems = [
  { icon: Home, label: "Overview", id: "overview", path: "/dashboard/overview" },
  { icon: Compass, label: "Career Path", id: "career", path: "/dashboard/career" },
  { icon: BookOpen, label: "Learning", id: "learning", path: "/dashboard/learning" },
  { icon: RefreshCw, label: "Skill Exchange", id: "skills", path: "/dashboard/skills" },
  { icon: MessageSquare, label: "AI Assistant", id: "assistant", path: "/dashboard/assistant" },
  { icon: Settings, label: "Settings", id: "settings", path: "/dashboard/settings" },
  { icon: User, label: "Profile", id: "profile", path: "/dashboard/profile" },
];

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Dashboard: Error fetching profile", error);
        // If profile fetch fails, token might be invalid
        logout();
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl lg:flex sticky top-0 h-screen">
        <div className="flex h-32 items-center px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Nextaro Logo" className="h-24 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-between p-6">
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 group ${isActive
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`
                }
              >
                <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110`} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="group mt-auto flex w-full items-center justify-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 transform bg-card/95 backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-32 items-center justify-between px-8 border-b border-border/40">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Nextaro Logo" className="h-20 w-auto object-contain" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold transition-all ${isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-start gap-3 rounded-2xl px-4 py-4 font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Background Decorative Blurs */}
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

        {/* Top Bar */}
        <header className="flex h-24 items-center justify-between border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 lg:px-12 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-2xl bg-muted/50 p-3 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
                Hey, {profile?.fullName?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="hidden text-sm font-medium text-muted-foreground sm:block">
                Here's what's happening with your career today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-bold text-foreground">{profile?.fullName}</p>
              <p className="text-xs font-semibold text-primary">{profile?.jobTitle || "Nextaro Explorer"}</p>
            </div>
            <div className="group relative cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                {getInitials(profile?.fullName || "")}
              </div>
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 shadow-sm" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-12 animate-in fade-in duration-700">
          <div className="max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="overview" element={<OverviewShell />} />
              <Route path="career" element={<CareerPathShell />} />
              <Route path="learning" element={<LearningShell />} />
              <Route path="skills" element={<SkillExchangeShell />} />
              <Route path="assistant" element={<AIAssistantShell />} />
              <Route path="settings" element={<SettingsShell />} />
              <Route path="profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
