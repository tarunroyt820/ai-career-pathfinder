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
    <section id="how-it-works" className="section-primary relative px-4 py-32 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(22,160,133,0.12)] text-[#16A085] text-[10px] font-black uppercase tracking-widest border border-[rgba(22,160,133,0.25)]">
            <Sparkles className="h-3 w-3" />
            Operational Protocol
          </div>
          <h2 className="text-white text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
            Automate Your <br />
            <span className="text-teal-gradient">Evolution.</span>
          </h2>
          <p className="text-[#BDD8E9] max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
            The Nextaro protocol is engineered for velocity and precision. <br className="hidden md:block" />
            No friction. No filler. Just your architectural future.
          </p>
        </div>

        {/* Steps Journey Card Grid */}
        <div className="grid gap-8 lg:grid-cols-4 relative">
          {steps.map((item, i) => (
            <div key={i} className="group relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-[rgba(22,160,133,0.2)] opacity-0 group-hover:opacity-100 blur-[80px] transition-opacity duration-700" />

              <div className="abyss-card relative h-full p-8 lg:p-10 transition-all duration-500 group-hover:translate-y-[-8px] shadow-xl shadow-black/5">
                {/* Step Header */}
                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-[rgba(22,160,133,0.12)] border border-[rgba(22,160,133,0.2)] transition-all duration-500 group-hover:scale-110">
                      <item.icon className="h-8 w-8 text-white transition-colors" />
                    </div>
                    <span className="text-4xl font-black text-[#7BBDE8]/40 group-hover:text-white/50 transition-colors uppercase tracking-tighter">
                      {item.step}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-black tracking-tight text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-base font-medium leading-relaxed text-[#BDD8E9] transition-colors">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[rgba(21,86,91,0.25)]">
                    {item.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 pr-2">
                        <div className="h-1 w-1 rounded-full bg-[#16A085]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#7BBDE8]/70">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
