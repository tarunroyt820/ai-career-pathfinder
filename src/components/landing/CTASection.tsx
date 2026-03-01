import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Globe, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="section-primary relative px-4 py-32 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-[4rem] bg-[linear-gradient(135deg,#16A085_0%,#153D4C_50%,#7BBDE8_100%)] p-1 shadow-[0_32px_120px_-20px_rgba(22,160,133,0.3)]">
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] rounded-[4rem]" />

          <div className="bg-[rgba(20,12,48,0.9)] backdrop-blur-3xl rounded-[3.9rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Globe className="h-64 w-64 text-white" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[rgba(22,160,133,0.15)] backdrop-blur-md text-white border border-[rgba(22,160,133,0.3)] shadow-xl">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Immediate Deployment</span>
              </div>
              <h2 className="text-white text-4xl md:text-7xl font-black tracking-tight leading-[0.9]">
                Unlock your <br />
                Future Today.
              </h2>
              <p className="text-[#BDD8E9] mx-auto max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
                Join the elite 1% of career builders who use AI to navigate the professional landscape.
                No more guesswork—just pure, data-driven trajectory.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/signup")}
                className="h-20 w-full sm:w-auto px-12 rounded-3xl bg-[#16A085] text-white hover:bg-[#168777] glow-teal font-black uppercase tracking-widest shadow-2xl shadow-black/20 transition-all hover:scale-105"
              >
                Join Nextaro Protocol
                <ArrowRight className="ml-3 h-6 w-6 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="h-20 w-full sm:w-auto px-12 rounded-3xl border-[rgba(22,160,133,0.4)] bg-transparent text-white hover:bg-[rgba(22,160,133,0.1)] text-lg font-black uppercase tracking-widest"
              >
                Sign In
              </Button>
            </div>

            <div className="pt-8 flex flex-wrap justify-center items-center gap-8 relative z-10">
              <div className="flex items-center gap-2 text-[#7BBDE8] font-black text-xs uppercase tracking-widest">
                <ShieldCheck className="h-5 w-5" /> 100% Encrypted Data
              </div>
              <div className="flex items-center gap-2 text-[#7BBDE8] font-black text-xs uppercase tracking-widest">
                <Sparkles className="h-5 w-5" /> AI Roadmap Included
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
