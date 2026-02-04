"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Users } from "lucide-react";

interface HeroSectionProps {
  onNavigate: (view: "landing" | "login" | "signup" | "dashboard") => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
      {/* Background gradient elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[700px] w-[700px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Career Guidance</span>
          </div>

          {/* Headline */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Discover Your Ideal
            <span className="mt-2 block text-primary">
              Career Path
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Let AI analyze your skills, interests, and goals to create a personalized career roadmap. 
            Exchange skills with others and accelerate your professional growth.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={() => onNavigate("signup")}
              className="group h-14 w-full rounded-2xl px-8 text-base font-semibold shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 sm:w-auto"
            >
              Start Your Journey
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

          {/* Social Proof */}
          <div className="mt-20 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">10K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 shadow-lg shadow-accent/10">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">85%</p>
                <p className="text-sm text-muted-foreground">Career Match Rate</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary shadow-lg">
                <Sparkles className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">50K+</p>
                <p className="text-sm text-muted-foreground">Skills Exchanged</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
