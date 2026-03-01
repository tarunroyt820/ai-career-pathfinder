import { Button } from "@/components/ui/button";
import { ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: "Capabilities", href: "#features" },
    { label: "Protocol", href: "#how-it-works" },
    { label: "Proof", href: "#testimonials" },
    { label: "Exchange", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-2xl border-b border-border/50">
      <nav className="mx-auto flex h-20 md:h-28 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo Section - High Visibility */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <Logo size="sm" />
              <div className="absolute -inset-4 bg-primary/20 blur-[32px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-xl font-black tracking-tighter text-foreground leading-none">NEXTARO</span>
              <span className="text-[8px] font-black tracking-[0.3em] text-primary uppercase ml-0.5 mt-1">Intelligence</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links - Refined Hierarchy */}
        <div className="hidden items-center bg-muted/20 backdrop-blur-2xl px-1.5 py-1.5 rounded-full border border-border/50 gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] transition-all hover:text-primary rounded-full hover:bg-muted/30"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs - Premium Styling */}
        <div className="hidden items-center gap-6 md:flex">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-[10px] font-black uppercase tracking-[0.2em] px-6 h-12 rounded-2xl text-muted-foreground hover:text-foreground transition-all shadow-none"
          >
            Login
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            className="relative group overflow-hidden text-[10px] font-black uppercase tracking-[0.2em] px-10 h-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_40px_-12px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_12px_50px_-12px_rgba(var(--primary-rgb),0.7)] active:scale-95 transition-all"
          >
            <span className="relative z-10">Sign Up</span>
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl p-4 text-muted-foreground bg-muted/30 border border-border/50 hover:bg-muted/50 md:hidden transition-all"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-20 left-0 right-0 p-6 animate-in fade-in slide-in-from-top-4 duration-500 md:hidden z-50">
          <div className="rounded-[3rem] border border-border/50 bg-background/95 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] p-10 space-y-10">
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-2xl font-black uppercase tracking-tighter text-muted-foreground hover:text-primary transition-all flex items-center justify-between"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                  <ChevronRight className="h-5 w-5 opacity-30" />
                </a>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="rounded-3xl h-16 font-black uppercase tracking-widest text-xs border-border bg-muted/30"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  navigate("/signup");
                  setMobileMenuOpen(false);
                }}
                className="rounded-3xl h-16 font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
