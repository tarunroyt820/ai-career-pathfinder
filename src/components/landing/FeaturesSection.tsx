"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Compass, GraduationCap, LineChart, RefreshCw, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Career Analysis",
    description: "Our advanced AI analyzes your skills, experience, and interests to identify your perfect career matches with detailed insights.",
  },
  {
    icon: Compass,
    title: "Personalized Roadmap",
    description: "Get a step-by-step career roadmap tailored to your goals, including recommended skills, certifications, and milestones.",
  },
  {
    icon: RefreshCw,
    title: "Skill Exchange",
    description: "Connect with other professionals to exchange knowledge. Teach what you know, learn what you need.",
  },
  {
    icon: GraduationCap,
    title: "Learning Paths",
    description: "Access curated learning resources and courses aligned with your career goals and skill gaps.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "Monitor your growth with detailed analytics, skill assessments, and milestone achievements.",
  },
  {
    icon: Shield,
    title: "Industry Insights",
    description: "Stay ahead with real-time market trends, salary data, and demand forecasts for your target roles.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-muted/40 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything You Need to Accelerate Your Career
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Powerful features designed to help you discover, plan, and achieve your career goals.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
            >
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
