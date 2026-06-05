import { Brain, BriefcaseBusiness, Compass, GraduationCap, LineChart, RefreshCw, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/common/Button";

const features = [
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Neural networks that scan your trajectory and predict high-yield career pivots before the market does.",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    image: "/images/feature-ai-analysis.jpg",
    imageAlt: "AI neural network visualization"
  },
  {
    icon: Compass,
    title: "Live Roadmaps",
    description: "Step-by-step navigation that recalculates as you gain skills, ensuring you never take a wrong turn.",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
    image: "/images/feature-live-roadmaps.jpg",
    imageAlt: "Glowing navigation route map"
  },
  {
    icon: RefreshCw,
    title: "Skill Marketplace",
    description: "Trade your expertise in a verified network. Teach React, learn Rust, and grow your professional social capital.",
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-500",
    image: "/images/feature-skill-marketplace.jpg",
    imageAlt: "Digital skill exchange network"
  },
  {
    icon: GraduationCap,
    title: "Curated Learning",
    description: "No more tutorial hell. Get direct access to high-impact resources verified by industry experts.",
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
    image: "/images/feature-curated-learning.jpg",
    imageAlt: "Books and learning resources"
  },
  {
    icon: LineChart,
    title: "Growth Metrics",
    description: "Visualize your market value. Track your mastery levels against global benchmarks in real-time.",
    color: "from-indigo-500/20 to-blue-500/20",
    iconColor: "text-indigo-500",
    image: "/images/feature-growth-metrics.jpg",
    imageAlt: "Analytics growth chart dashboard"
  },
  {
    icon: BriefcaseBusiness,
    title: "Business Insights",
    description: "Get practical business-facing guidance, market context, and service positioning signals that help turn career growth into real commercial opportunities.",
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
    image: "/images/feature-elite-network.jpg",
    imageAlt: "Business planning and market strategy workspace"
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="section-alt relative px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-32">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(22,160,133,0.12)] text-[#16A085] text-[10px] font-black uppercase tracking-[0.2em] border border-[rgba(22,160,133,0.25)]">
              <Zap className="h-3 w-3" />
              Core Capabilities
            </div>
            <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[0.9]">
              Supercharge your <br />
              <span className="text-teal-gradient">Professional Engine.</span>
            </h2>
            <p className="text-[#BDD8E9] text-lg md:text-xl font-medium leading-relaxed">
              Nextaro isn't a simple dashboard—it's a high-precision neural command center <br className="hidden md:block" /> for your entire global career trajectory.
            </p>
          </div>
          <Button variant="outline" className="h-16 px-10 rounded-2xl font-black uppercase tracking-[0.2em] gap-3 group border-[rgba(22,160,133,0.40)] text-white hover:bg-[rgba(22,160,133,0.10)] text-xs">
            System Documentation
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="group relative w-full">
              {/* Outer Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-40 blur-[80px] transition-opacity duration-700`} />

              <div className="abyss-card relative h-full p-10 lg:p-12 transition-all duration-500 hover:translate-y-[-12px] shadow-xl shadow-black/5 overflow-hidden">
                {/* Inner Color Tint */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                {/* Card Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
                  <img
                    src={feature.image}
                    alt={feature.imageAlt}
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute top-0 left-0 w-full h-[55%] object-cover object-top scale-105 group-hover:scale-100 opacity-[0.38] group-hover:opacity-[0.62] transition-all duration-700"
                  />
                  {/* Fade gradient — blends image into card background */}
                  <div
                    className="absolute top-0 left-0 w-full h-[72%] pointer-events-none"
                    style={{
                      background: "linear-gradient(to bottom, transparent 0%, transparent 25%, #14253E 70%, #14253E 100%)"
                    }}
                  />
                  {/* Side vignette — keeps card edges clean */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at center top, transparent 25%, rgba(20,37,62,0.75) 100%)"
                    }}
                  />
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-[rgba(22,160,133,0.15)] border border-[rgba(22,160,133,0.20)] transition-all duration-500 group-hover:scale-110">
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
