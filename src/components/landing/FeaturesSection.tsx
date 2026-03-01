import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Compass, GraduationCap, LineChart, RefreshCw, Shield, Zap, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/common/Button";

const features = [
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Neural networks that scan your trajectory and predict high-yield career pivots before the market does.",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500"
  },
  {
    icon: Compass,
    title: "Live Roadmaps",
    description: "Step-by-step navigation that recalculates as you gain skills, ensuring you never take a wrong turn.",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500"
  },
  {
    icon: RefreshCw,
    title: "Skill Marketplace",
    description: "Trade your expertise in a verified network. Teach React, learn Rust, and grow your professional social capital.",
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-500"
  },
  {
    icon: GraduationCap,
    title: "Curated Learning",
    description: "No more tutorial hell. Get direct access to high-impact resources verified by industry experts.",
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500"
  },
  {
    icon: LineChart,
    title: "Growth Metrics",
    description: "Visualize your market value. Track your mastery levels against global benchmarks in real-time.",
    color: "from-indigo-500/20 to-blue-500/20",
    iconColor: "text-indigo-500"
  },
  {
    icon: Shield,
    title: "Elite Network",
    description: "Join a gated community of builders. Verified credentials ensure high-quality exchanges every time.",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500"
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="section-alt relative px-4 py-32 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-32">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(22,160,133,0.12)] text-[#16A085] text-[10px] font-black uppercase tracking-[0.2em] border border-[rgba(22,160,133,0.25)]">
              <Zap className="h-3 w-3" />
              Core Capabilities
            </div>
            <h2 className="text-white text-5xl md:text-7xl font-black tracking-tight leading-[0.9]">
              Supercharge your <br />
              <span className="text-teal-gradient">Professional Engine.</span>
            </h2>
            <p className="text-[#BDD8E9] text-lg md:text-xl font-medium leading-relaxed">
              Nextaro isn't a simple dashboard—it's a high-precision neural command center <br className="hidden md:block" /> for your entire global career trajectory.
            </p>
          </div>
          <Button variant="outline" className="h-16 px-10 rounded-2xl font-black uppercase tracking-[0.2em] gap-3 group border-[rgba(22,160,133,0.25)] text-white hover:bg-[rgba(22,160,133,0.1)] text-xs">
            System Documentation
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="group relative">
              {/* Outer Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-40 blur-[80px] transition-opacity duration-700`} />

              <div className="abyss-card relative h-full p-10 lg:p-12 transition-all duration-500 hover:translate-y-[-12px] shadow-xl shadow-black/5 overflow-hidden">
                {/* Inner Color Tint */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                <div className="relative z-10 space-y-8">
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-[rgba(22,160,133,0.12)] border border-[rgba(22,160,133,0.2)] transition-all duration-500 group-hover:scale-110">
                    <feature.icon className="h-8 w-8 text-[#16A085]" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-black tracking-tight text-white">{feature.title}</h3>
                    <p className="text-base font-medium leading-relaxed text-[#BDD8E9] transition-colors duration-500">
                      {feature.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#16A085]">LEARN MORE</span>
                    <div className="h-px flex-grow bg-[rgba(22,160,133,0.2)]" />
                    <ChevronRight className="h-4 w-4 text-[#16A085]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
