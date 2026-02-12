import { CheckCircle2, ChevronRight, Sparkles, Target, Users, Wand2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Onboarding Protocol",
    description: "Initialize your profile with our deep-scan assessment covering skills, subconscious interests, and long-term ambition.",
    icon: Target,
    highlights: ["Symmetry mapping", "Interest profiling"],
  },
  {
    step: "02",
    title: "AI Synthesis",
    description: "Our proprietary engine cross-references your profile against 50,000+ career trajectories to identify high-probability matches.",
    icon: Wand2,
    highlights: ["Gap recognition", "Market simulation"],
  },
  {
    step: "03",
    title: "Deployment Plan",
    description: "Receive a hyper-granular roadmap with specific skills to master, mentors to find, and milestones to achieve.",
    icon: Sparkles,
    highlights: ["Adaptive timelines", "Curated stacks"],
  },
  {
    step: "04",
    title: "Network Synergy",
    description: "Enter the community pool to trade skills with verified peers, accelerating mutual growth through direct knowledge exchange.",
    icon: Users,
    highlights: ["Verified trading", "Peer validation"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative px-4 py-32 sm:px-6 lg:px-8 overflow-hidden bg-background">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20">
            <Sparkles className="h-3 w-3" />
            Operational Protocol
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-foreground">
            Automate Your <br />
            <span className="text-gradient">Evolution.</span>
          </h2>
          <p className="max-w-2xl text-lg md:text-xl font-medium text-muted-foreground leading-relaxed">
            The Nextaro protocol is engineered for velocity and precision. <br className="hidden md:block" />
            No friction. No filler. Just your architectural future.
          </p>
        </div>

        {/* Steps Journey Card Grid */}
        <div className="grid gap-8 lg:grid-cols-4 relative">
          {steps.map((item, i) => (
            <div key={i} className="group relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 blur-[80px] transition-opacity duration-700" />

              <div className="relative h-full p-8 lg:p-10 rounded-[3rem] bg-card/40 border border-border/50 backdrop-blur-3xl transition-all duration-500 group-hover:translate-y-[-8px] group-hover:border-primary/30 group-hover:bg-card/60 shadow-xl shadow-black/5">
                {/* Step Header */}
                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center border border-border group-hover:bg-primary group-hover:border-primary transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">
                      <item.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-4xl font-black text-foreground/10 group-hover:text-primary/20 transition-colors uppercase tracking-tighter">
                      {item.step}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-base font-medium leading-relaxed text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                    {item.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 pr-2">
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
