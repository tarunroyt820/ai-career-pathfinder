import { Button } from "@/components/ui/button";
import { Briefcase, FileText, ArrowRight, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedElement } from "@/components/ui/animated-element";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 gradient-orange-purple relative overflow-hidden transition-colors duration-500 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-112px)] flex items-center">
      {/* Background animated shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 150 - 75],
              y: [0, Math.random() * 150 - 75],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: Math.random() * 15 + 10,
            }}
          />
        ))}
      </div>

      <div className="container px-4 md:px-12 relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left Column: Content */}
          <AnimatedElement animation="slide-up" className="space-y-6 flex flex-col items-start text-left">
            {/* Logo Placeholder / Badge */}
            <div className="bg-white/90 backdrop-blur rounded-md p-3 mb-2 shadow-sm border border-white/20">
              <div className="flex items-center gap-2 text-vibrant-purple font-black tracking-tighter italic text-xl px-4">
                <GraduationCap className="h-6 w-6" />
                <span>PATHFINDER</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-6xl xl:text-7xl/none text-white leading-[1.1]">
                Discover Your Ideal <br className="hidden xl:block" /> Career Path
              </h1>
              <p className="max-w-[600px] text-white/90 md:text-xl font-medium">
                Our AI-powered platform analyses your skills, courses, and
                CV to recommend the best career paths for you.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center justify-center gap-2 bg-white text-vibrant-purple hover:bg-white/90 text-lg px-8 py-6 h-auto font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Briefcase className="h-5 w-5" />
                Get Started
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ArrowRight className="ml-1 h-5 w-5" />
                </motion.div>
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white hover:bg-white/20 text-lg px-8 py-6 h-auto font-bold rounded-xl transition-all active:scale-95"
              >
                <FileText className="h-5 w-5" />
                Learn More
              </button>
            </div>
          </AnimatedElement>

          {/* Right Column: Illustration from Folder */}
          <AnimatedElement animation="scale" delay={0.2} className="relative hidden lg:block">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20 w-full"
            >
              {/* Correct image from the source folder */}
              <img
                src="/placeholder.png"
                alt="Career Path Illustration"
                className="w-full h-auto rounded-xl object-contain drop-shadow-2xl"
              />
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -bottom-6 -left-6 w-32 h-32 bg-vibrant-pink rounded-full blur-3xl opacity-40"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
            />
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
}
