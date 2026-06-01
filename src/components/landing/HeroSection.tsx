import { Button } from "@/components/ui/button";
import { Briefcase, FileText, ArrowRight, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedElement } from "@/components/ui/animated-element";

export function HeroSection() {
  const navigate = useNavigate();

  return (
      <section className="w-full py-12 md:py-24 lg:py-32 min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-112px)] flex items-center overflow-hidden section-primary relative isolate">
      {/* ═══════════════════════════════════════════════
          BACKGROUND MOTION LAYER
          All colours are shades from the existing palette.
          Blobs sit behind all content (z-index: -1 / z-0).
          They drift slowly so the bg feels alive, not flat.
      ═══════════════════════════════════════════════ */}

      {/* Blob A — Large teal aurora, top-left, slow drift */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full -z-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(22,160,133,0.18) 0%, rgba(22,160,133,0.06) 40%, transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={{
          x: [0, 28, -18, 0],
          y: [0, -22, 26, 0],
          scale: [1, 1.07, 0.95, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "easeInOut",
        }}
      />

      {/* Blob B — Ice blue shimmer, top-right, counter drift */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-48 w-[520px] h-[520px] rounded-full -z-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(123,189,232,0.12) 0%, rgba(123,189,232,0.04) 40%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{
          x: [0, -22, 14, 0],
          y: [0, 18, -14, 0],
          scale: [1, 0.94, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 25,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Blob C — Deep navy depth, bottom-centre, gentle pulse */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/4 w-[480px] h-[480px] rounded-full -z-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(20,37,62,0.55) 0%, rgba(21,61,76,0.20) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.10, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Blob D — Teal accent, bottom-left, slow breathe */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 w-[360px] h-[360px] rounded-full -z-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(22,160,133,0.14) 0%, rgba(21,86,91,0.06) 40%, transparent 70%)",
          filter: "blur(70px)",
        }}
        animate={{
          scale: [1, 1.14, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Blob E — Pale ice, bottom-right behind image area, drift */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-16 w-[400px] h-[400px] rounded-full -z-10"
        style={{
          background:
            "radial-gradient(circle at center, rgba(189,216,233,0.08) 0%, rgba(123,189,232,0.04) 40%, transparent 70%)",
          filter: "blur(85px)",
        }}
        animate={{
          x: [0, -12, 10, 0],
          y: [0, -8, 16, 0],
          scale: [1, 1.05, 0.97, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "easeInOut",
          delay: 6,
        }}
      />

      {/* Subtle diagonal light streak — static, no animation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(125deg, transparent 30%, rgba(22,160,133,0.03) 50%, transparent 70%)",
          transform: "rotate(-8deg) scale(1.3)",
        }}
      />

      <div className="container px-4 md:px-12 relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column: Content */}
          <AnimatedElement animation="slide-up" className="space-y-6 flex flex-col items-start text-left w-full lg:w-1/2">
            {/* Logo Placeholder / Badge */}
            <div className="bg-[rgba(22,160,133,0.12)] backdrop-blur-xl rounded-2xl p-3 mb-2 shadow-xl border border-[rgba(22,160,133,0.25)] mx-auto lg:mx-0">
              <div className="flex items-center gap-2 text-[#16A085] font-black tracking-tighter italic text-xl px-4">
                <GraduationCap className="h-6 w-6" />
                <span>PATHFINDER</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-white text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1]">
                Discover Your <span className="text-teal-gradient">Ideal</span> <br className="hidden xl:block" /> Career Path
              </h1>
              <p className="text-[#BDD8E9] text-base md:text-lg lg:text-xl font-medium max-w-[600px]">
                Our AI-powered platform analyses your skills, courses, and
                CV to recommend the best career paths for you.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/signup")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16A085] text-white hover:bg-[#168777] glow-teal text-lg px-8 py-4 font-bold rounded-2xl shadow-lg transition-all duration-300 active:scale-95 hover:scale-105"
              >
                <Briefcase className="h-5 w-5" />
                Get Started
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ArrowRight className="ml-1 h-5 w-5" />
                </motion.div>
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[rgba(22,160,133,0.4)] bg-[rgba(21,86,91,0.2)] text-white hover:bg-[rgba(22,160,133,0.15)] text-lg px-8 py-4 font-bold rounded-2xl transition-all duration-300 active:scale-95"
              >
                <FileText className="h-5 w-5" />
                Learn More
              </button>
            </div>
          </AnimatedElement>

          {/* Right Column: Illustration from Folder */}
          <AnimatedElement animation="scale" delay={0.2} className="relative w-full lg:w-1/2">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="bg-[rgba(13,17,40,0.75)] backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-[rgba(22,160,133,0.35)] w-full"
            >
              {/* Correct image from the source folder */}
              <img
                src="/placeholder.png"
                alt="Career Path Illustration"
                className="w-full h-auto rounded-xl object-contain drop-shadow-2xl"
                style={{ 
                    filter: 'brightness(0.90) saturate(1.1) contrast(1.05)',
                    opacity: 1
                }}
              />
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -bottom-6 -left-6 size-32 bg-vibrant-pink rounded-full blur-3xl opacity-40"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
            />

            {/* Pulsing teal halo — sits directly behind the image card */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-3xl -z-10"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(22,160,133,0.22) 0%, rgba(22,160,133,0.06) 55%, transparent 80%)",
                filter: "blur(45px)",
              }}
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
            />

            {/* Teal corner glow — bottom-left of image */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-8 -left-8 size-36 rounded-full -z-10"
              style={{
                background:
                  "radial-gradient(circle, rgba(22,160,133,0.45) 0%, transparent 70%)",
                filter: "blur(32px)",
              }}
              animate={{
                scale: [1, 1.30, 1],
                opacity: [0.4, 0.85, 0.4],
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut",
              }}
            />

            {/* Ice blue corner glow — top-right of image */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full -z-10"
              style={{
                background:
                  "radial-gradient(circle, rgba(123,189,232,0.35) 0%, transparent 70%)",
                filter: "blur(28px)",
              }}
              animate={{
                scale: [1, 1.20, 1],
                opacity: [0.35, 0.75, 0.35],
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </AnimatedElement>
        </div>
      </div>
    </section>
  );
}
