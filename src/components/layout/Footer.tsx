import { Github, Linkedin, Twitter, Sparkles } from "lucide-react";
import logo from "@/assets/images/nextaro-logo.png";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Roadmap", href: "#" },
    { label: "API", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  resources: [
    { label: "Documentation", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-8 py-24 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-6 items-start">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-10">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="relative">
                  <img src={logo} alt="Nextaro Logo" className="h-16 md:h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-foreground leading-none">NEXTARO</span>
                  <span className="text-[10px] font-black tracking-[0.3em] text-primary uppercase ml-0.5 mt-1">Intelligence</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary w-fit text-[10px] font-black uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3" />
                V2.0 STABLE
              </div>
            </div>
            <p className="max-w-xs text-base font-medium leading-relaxed text-muted-foreground/80">
              The neural operating system for modern career growth. Automate your mastery, exchange your skills, and master your professional destiny.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:shadow-xl hover:shadow-primary/5 hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-4 lg:col-span-4 lg:pt-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Core Platform</h3>
              <ul className="space-y-4">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm font-bold text-muted-foreground transition-all hover:text-primary hover:translate-x-1 inline-block">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Organization</h3>
              <ul className="space-y-4">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm font-bold text-muted-foreground transition-all hover:text-primary hover:translate-x-1 inline-block">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Developers</h3>
              <ul className="space-y-4">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm font-bold text-muted-foreground transition-all hover:text-primary hover:translate-x-1 inline-block">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Compliance</h3>
              <ul className="space-y-4">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm font-bold text-muted-foreground transition-all hover:text-primary hover:translate-x-1 inline-block">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-24 pt-12 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Nextaro Intelligence Protocol. Secure Build 8142.
          </p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> ALL SYSTEMS OPERATIONAL</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Server Node: SG-01</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
