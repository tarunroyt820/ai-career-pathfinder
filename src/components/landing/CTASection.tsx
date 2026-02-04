"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  onNavigate: (view: "landing" | "login" | "signup" | "dashboard") => void;
}

export function CTASection({ onNavigate }: CTASectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-accent/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="rounded-3xl border border-border/50 bg-card/80 p-12 text-center shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ready to Transform Your Career?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Join over 10,000 professionals who have discovered their ideal career path. 
            Start your free trial today - no credit card required.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={() => onNavigate("signup")}
              className="group h-14 w-full rounded-2xl px-8 text-base font-semibold shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("login")}
              className="h-14 w-full rounded-2xl border-2 px-8 text-base font-semibold transition-all hover:bg-primary/5 sm:w-auto"
            >
              Sign In
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Free 14-day trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
