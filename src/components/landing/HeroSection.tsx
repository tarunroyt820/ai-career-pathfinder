import { Button } from "@/components/ui/button";
import { Briefcase, FileText, ArrowRight, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedElement } from "@/components/ui/animated-element";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-112px)] flex items-center overflow-hidden section-primary relative">
      <div className="container px-4 md:px-12 relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Left Column: Content */}
          <AnimatedElement animation="slide-up" className="space-y-6 flex flex-col items-start text-left">
            {/* Logo Placeholder / Badge */}
            <div className="bg-[rgba(22,160,133,0.12)] backdrop-blur-xl rounded-2xl p-3 mb-2 shadow-xl border border-[rgba(22,160,133,0.25)]">
              <div className="flex items-center gap-2 text-[#16A085] font-black tracking-tighter italic text-xl px-4">
                <GraduationCap className="h-6 w-6" />
                <span>PATHFINDER</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-white text-4xl sm:text-6xl xl:text-7xl/none font-extrabold tracking-tighter leading-[1.1]">
                Discover Your <span className="text-teal-gradient">Ideal</span> <br className="hidden xl:block" /> Career Path
              </h1>
              <p className="text-[#BDD8E9] md:text-xl font-medium max-w-[600px]">
                Our AI-powered platform analyses your skills, courses, and
                CV to recommend the best career paths for you.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 bg-[#16A085] text-white hover:bg-[#168777] glow-teal text-lg px-8 py-4 font-bold rounded-2xl shadow-lg transition-all duration-300 active:scale-95 hover:scale-105"
              >
                <Briefcase className="h-5 w-5" />
                Get Started
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ArrowRight className="ml-1 h-5 w-5" />
                </motion.div>
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 border border-[rgba(22,160,133,0.4)] bg-[rgba(21,86,91,0.2)] text-white hover:bg-[rgba(22,160,133,0.15)] text-lg px-8 py-4 font-bold rounded-2xl transition-all duration-300 active:scale-95"
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
