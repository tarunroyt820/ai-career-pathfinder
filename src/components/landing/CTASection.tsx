import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Globe, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative px-4 py-32 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background with dynamic pulse */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1)_0%,transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-[4rem] bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-gradient p-1 shadow-[0_32px_120px_-20px_rgba(var(--primary-rgb),0.3)]">
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] rounded-[4rem]" />

          <div className="bg-background/10 backdrop-blur-3xl rounded-[3.9rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Globe className="h-64 w-64 text-white" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xl">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Immediate Deployment</span>
              </div>
              <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-[0.9] text-white">
                Unlock your <br />
                Future Today.
              </h2>
              <p className="mx-auto max-w-2xl text-lg md:text-xl font-medium leading-relaxed text-white/80">
                Join the elite 1% of career builders who use AI to navigate the professional landscape.
                No more guesswork—just pure, data-driven trajectory.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="h-20 w-full sm:w-auto px-12 rounded-3xl bg-white text-primary hover:bg-white/90 hover:scale-[1.05] transition-all text-lg font-black uppercase tracking-widest shadow-2xl shadow-black/20"
              >
                Join Nextaro Protocol
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="h-20 w-full sm:w-auto px-12 rounded-3xl border-white/30 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 text-lg font-black uppercase tracking-widest"
              >
                Sign In
              </Button>
            </div>

            <div className="pt-8 flex flex-wrap justify-center items-center gap-8 relative z-10">
              <div className="flex items-center gap-2 text-white/60 font-black text-xs uppercase tracking-widest">
                <ShieldCheck className="h-5 w-5" /> 100% Encrypted Data
              </div>
              <div className="flex items-center gap-2 text-white/60 font-black text-xs uppercase tracking-widest">
                <Sparkles className="h-5 w-5" /> AI Roadmap Included
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
