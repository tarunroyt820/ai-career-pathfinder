import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users, Zap, Award, Target, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden px-4 md:px-8 py-20 lg:py-32">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-accent/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      <div className="relative mx-auto max-w-7xl w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 shadow-xl shadow-primary/5">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">AI Career Intelligence v2.0</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] text-foreground">
              Master Your <br />
              <span className="text-gradient">Professional</span> <br />
              Destiny.
            </h1>

            {/* Subheadline */}
            <p className="max-w-xl mx-auto lg:mx-0 text-lg md:text-xl font-medium leading-relaxed text-muted-foreground">
              Nextaro combines hyper-personalized AI roadmaps with a high-trust skill exchange network to accelerate your journey to the top.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="group h-16 w-full sm:w-auto px-10 rounded-2xl shadow-2xl shadow-primary/20"
              >
                Sign Up
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="h-16 w-full sm:w-auto px-10 rounded-2xl border-border/40 hover:bg-muted/50"
              >
                Login
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap justify-center lg:justify-start items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">Trusted by builders at</p>
              <div className="flex items-center gap-2 font-black text-lg italic tracking-tighter">
                <Target className="h-5 w-5" /> FORTUNE 500
              </div>
              <div className="flex items-center gap-2 font-black text-lg italic tracking-tighter">
                <Zap className="h-5 w-5" /> REPLIT
              </div>
              <div className="flex items-center gap-2 font-black text-lg italic tracking-tighter">
                <Award className="h-5 w-5" /> YC ALUM
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="hidden lg:block relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-200">
            <div className="relative z-10 p-2 rounded-[3.5rem] bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)]">
              <div className="bg-background/90 rounded-[2.9rem] overflow-hidden border border-border/50 backdrop-blur-md">
                {/* Window Header */}
                <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-muted/30">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80 shadow-sm" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-sm" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80 shadow-sm" />
                  </div>
                  <div className="px-5 py-1.5 rounded-full bg-background/50 border border-border/50 text-[10px] font-black tracking-widest uppercase text-muted-foreground transition-all hover:bg-background">
                    nextaro.ai / user_dashboard
                  </div>
                  <div className="h-4 w-4 rounded-full border-2 border-primary/30" />
                </div>

                {/* Dashboard Content Mockup */}
                <div className="p-10 space-y-10">
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-3 group hover:bg-primary/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <Users className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/20 rounded-lg">ACTIVE</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network</p>
                        <p className="text-3xl font-black">2.4k+</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-[2.5rem] bg-accent/5 border border-accent/10 space-y-3 group hover:bg-accent/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <Zap className="h-6 w-6 text-accent" />
                        <span className="text-[10px] font-black text-accent px-2 py-1 bg-accent/20 rounded-lg">+12%</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Growth</p>
                        <p className="text-3xl font-black">Score 89</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Roadmap Visualization */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" /> AI Career Path
                      </h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="relative space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">1</div>
                        <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                          <div className="h-full w-full bg-primary" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-muted border border-border/50 flex items-center justify-center text-muted-foreground font-black text-xs">2</div>
                        <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                          <div className="h-full w-[45%] bg-primary/50" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Preview */}
                  <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                      JD
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-foreground">John Doe</p>
                      <p className="text-xs font-bold text-muted-foreground">Product Designer L5</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Absolute floating elements */}
            <div className="absolute -top-16 -right-16 h-48 w-48 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute top-1/2 -left-32 w-64 p-8 rounded-[2.5rem] bg-background border border-border/40 shadow-2xl space-y-4 z-20 animate-float">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skill Match</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-black italic">
                  <span>98.2%</span>
                  <span className="text-green-500 text-xs mt-1">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
