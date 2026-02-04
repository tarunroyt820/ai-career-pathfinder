"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Tech Startup",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content: "Nextaro helped me transition from data analysis to software engineering. The AI-generated roadmap was incredibly accurate, and the skill exchange feature connected me with mentors who accelerated my learning.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager",
    company: "Fortune 500",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "I was stuck in my career for years. Nextaro's AI identified skill gaps I didn't even know I had. Within 8 months, I landed my dream product management role.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer",
    company: "Design Agency",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "The personalized learning paths were a game-changer. Instead of wasting time on irrelevant courses, Nextaro pointed me exactly where I needed to focus. Highly recommend!",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-muted/40 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Loved by Career Changers Worldwide
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Join thousands of professionals who have transformed their careers with Nextaro.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <CardContent className="p-8">
                {/* Rating */}
                <div className="mb-5 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={`star-${testimonial.name}-${i}`}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-base leading-relaxed text-muted-foreground">{testimonial.content}</p>

                {/* Author */}
                <div className="mt-8 flex items-center gap-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
