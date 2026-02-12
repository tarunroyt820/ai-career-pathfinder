import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, BadgeCheck, Sparkles } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Full Stack Architect",
    company: "Meta",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "The AI synthesized a roadmap that cut my learning curve by 40%. Trading my React skills for Python with a Google engineer was the pivot I needed.",
    rating: 5,
    verified: true
  },
  {
    name: "Marcus Johnson",
    role: "Lead Product Manager",
    company: "Stripe",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "Nextaro identified a high-demand skill gap in my profile that I was completely blind to. 6 months later, I'm leading a world-class PM team.",
    rating: 5,
    verified: true
  },
  {
    name: "Emily Rodriguez",
    role: "Senior Systems Designer",
    company: "Airbnb",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "Most platforms give you generic advice. Nextaro gives you a blueprint. The community has a level of trust I haven't seen anywhere else.",
    rating: 5,
    verified: true
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative px-4 py-32 sm:px-6 lg:px-8 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary-rgb),0.05)_0%,transparent_50%)]" />

      <div className="mx-auto max-w-7xl relative">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Social Pulse
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Verified Career <span className="text-gradient">Breakthroughs.</span>
          </h2>
          <p className="max-w-xl text-lg md:text-xl font-medium text-muted-foreground leading-relaxed">
            Join 10,000+ top-tier builders who have upgraded their professional trajectory using the Nextaro protocol.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <Card
              key={i}
              className="group relative rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 transition-all duration-500 hover:translate-y-[-8px] hover:border-primary/30"
            >
              <CardContent className="p-10 space-y-8">
                {/* Rating & Icons */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-1">
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Quote className="h-5 w-5" />
                  </div>
                </div>

                {/* Content */}
                <p className="text-lg font-bold leading-relaxed text-foreground/90 italic">
                  "{item.content}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-5 pt-4">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-2xl object-cover ring-4 ring-muted/20"
                    />
                    {item.verified && (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-card">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-foreground tracking-tight">{item.name}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {item.role}
                    </p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-tighter pt-1">
                      {item.company}
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
