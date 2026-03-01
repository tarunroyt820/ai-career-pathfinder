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
    <section id="testimonials" className="section-alt relative px-4 py-32 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl relative">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(22,160,133,0.12)] text-[#16A085] text-[10px] font-black uppercase tracking-widest border border-[rgba(22,160,133,0.25)]">
            <Sparkles className="h-3 w-3" />
            Social Pulse
          </div>
          <h2 className="text-white text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Verified Career <span className="text-teal-gradient">Breakthroughs.</span>
          </h2>
          <p className="text-[#BDD8E9] max-w-xl text-lg md:text-xl font-medium leading-relaxed">
            Join 10,000+ top-tier builders who have upgraded their professional trajectory using the Nextaro protocol.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <Card
              key={i}
              className="abyss-card group relative shadow-xl shadow-black/5 transition-all duration-500 hover:translate-y-[-8px]"
            >
              <CardContent className="p-10 space-y-8">
                {/* Rating & Icons */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-1">
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="h-4 w-4 fill-[#16A085] text-[#16A085]"
                      />
                    ))}
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-[rgba(22,160,133,0.1)] flex items-center justify-center text-[#BDD8E9] group-hover:text-white transition-colors">
                    <Quote className="h-5 w-5" />
                  </div>
                </div>

                {/* Content */}
                <p className="text-lg font-bold leading-relaxed text-white italic">
                  "{item.content}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-5 pt-4">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-2xl object-cover ring-4 ring-[rgba(22,160,133,0.2)]"
                    />
                    {item.verified && (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-[#16A085] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#14253E]">
                        <BadgeCheck className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-white tracking-tight">{item.name}</p>
                    <p className="text-xs font-bold text-[#7BBDE8] uppercase tracking-widest">
                      {item.role}
                    </p>
                    <p className="text-[10px] font-black text-[#16A085] uppercase tracking-tighter pt-1">
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
