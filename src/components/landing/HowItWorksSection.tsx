"use client";

import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Create Your Profile",
    description: "Sign up and complete your profile with your skills, experience, interests, and career aspirations.",
    highlights: ["Skills assessment", "Interest mapping", "Experience history"],
  },
  {
    step: "02",
    title: "AI Analysis",
    description: "Our AI analyzes your profile against thousands of career paths to find your best matches.",
    highlights: ["Pattern recognition", "Market analysis", "Skill gap identification"],
  },
  {
    step: "03",
    title: "Get Your Roadmap",
    description: "Receive a personalized career roadmap with actionable steps, timelines, and resources.",
    highlights: ["Custom milestones", "Learning resources", "Timeline planning"],
  },
  {
    step: "04",
    title: "Exchange & Grow",
    description: "Connect with others to exchange skills, get mentorship, and accelerate your journey.",
    highlights: ["Peer learning", "Skill exchange", "Community support"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            How Nextaro Works
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Four simple steps to transform your career trajectory with AI-powered guidance.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {steps.map((item) => (
            <div
              key={item.step}
              className="group relative flex gap-6 rounded-3xl border border-border/50 bg-card p-8 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
            >
              {/* Step Number */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                {item.step}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.description}</p>

                {/* Highlights */}
                <ul className="mt-5 flex flex-wrap gap-2">
                  {item.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
