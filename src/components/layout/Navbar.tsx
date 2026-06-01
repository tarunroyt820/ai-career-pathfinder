import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/common/Logo";

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
    <header className="sticky top-0 z-50 w-full bg-[rgba(20,12,48,0.85)] backdrop-blur-2xl border-b border-[rgba(21,86,91,0.25)] mb-6">
      <nav className="mx-auto flex h-20 md:h-28 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo Section - High Visibility */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative flex items-center justify-center" style={{ background: 'transparent' }}>
              <Logo size="md" className="brightness-110" />
              <div className="absolute -inset-4 bg-[rgba(22,160,133,0.25)] blur-[40px] rounded-full -z-10 opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white leading-none">NEXTARO</span>
              <span className="text-[11px] font-black tracking-[0.3em] text-[#BDD8E9] uppercase ml-0.5 mt-1">Intelligence</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links - Refined Hierarchy */}
        <div className="hidden lg:flex items-center bg-[rgba(22,160,133,0.08)] backdrop-blur-2xl px-1.5 py-1.5 rounded-full border border-[rgba(22,160,133,0.2)] gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-6 py-2 text-sm font-black text-[#BDD8E9] uppercase tracking-[0.15em] transition-colors hover:text-white rounded-full hover:bg-[rgba(22,160,133,0.15)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs - Premium Styling */}
        <div className="hidden lg:flex items-center gap-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-sm font-black uppercase tracking-[0.15em] px-6 h-12 rounded-2xl text-[#BDD8E9] hover:text-white transition-colors shadow-none"
          >
            Login
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            className="bg-[#16A085] text-white hover:bg-[#168777] font-bold rounded-xl px-4 py-2 glow-teal-sm transition-all"
          >
            <span className="relative z-10">Sign Up</span>
          </Button>
        </div>

        {/* Mobile Toggle */}
        {/* Hamburger Button - Mobile Only */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden flex flex-col justify-center items-center size-10 rounded-xl border border-[rgba(22,160,133,0.30)] bg-[rgba(20,37,62,0.60)] gap-1.5 hover:border-[#16A085] transition-all"
          aria-label="Open menu"
        >
          <span className="w-5 h-0.5 bg-[#BDD8E9] rounded-full" />
          <span className="w-5 h-0.5 bg-[#BDD8E9] rounded-full" />
          <span className="w-3 h-0.5 bg-[#BDD8E9] rounded-full self-end" />
        </button>
      </nav>

      {/* Dark Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#140C30] border-l border-[rgba(22,160,133,0.25)] z-50 lg:hidden flex flex-col transform transition-transform duration-300 ease-in-out shadow-[-20px_0_60px_rgba(0,0,0,0.5)] ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(22,160,133,0.15)]">
          <Logo size="sm" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="size-9 rounded-xl border border-[rgba(22,160,133,0.30)] bg-[rgba(20,37,62,0.80)] flex items-center justify-center hover:border-[#16A085] hover:bg-[rgba(22,160,133,0.15)] transition-all text-[#BDD8E9]"
          >
            ✕
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex flex-col p-6 gap-2 flex-1">
          {['CAPABILITIES', 'PROTOCOL', 'PROOF', 'EXCHANGE'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-[#BDD8E9] font-bold text-sm tracking-widest hover:bg-[rgba(22,160,133,0.10)] hover:text-white hover:border-l-2 hover:border-[#16A085] transition-all duration-200"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Drawer Bottom Buttons */}
        <div className="p-6 border-t border-[rgba(22,160,133,0.15)] flex flex-col gap-3">
          <a
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-3 rounded-xl text-center text-[#BDD8E9] font-bold text-sm tracking-widest border border-[rgba(22,160,133,0.30)] hover:border-[#16A085] hover:bg-[rgba(22,160,133,0.10)] transition-all"
          >
            LOGIN
          </a>
          <a
            href="/signup"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-3 rounded-xl text-center text-white font-bold text-sm tracking-widest bg-[#16A085] hover:bg-[#168777] transition-all"
          >
            SIGN UP
          </a>
        </div>
      </div>
    </header>
  );
}
