import { Button } from "@/components/common/Button";
import { InputField } from "@/components/common/InputField";
import { Chrome, Github, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, signup } from "@/services/authApi";
import { toast } from "sonner";
import logo from "@/assets/images/nextaro-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";

interface AuthPageProps {
  mode: "login" | "signup";
}

export function AuthPage({ mode }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (mode === "signup") {
        await signup(fullName, email, password);
        toast.success("Protocol Initialized: Welcome to Nextaro.");
      } else {
        await login(email, password);
        toast.success("Identity Verified: Welcome Back.");
      }

      // CRITICAL: Double-check token storage before navigation
      const storedToken = localStorage.getItem("nextro_token");
      if (!storedToken) {
        throw new Error("Token functionality verification failed.");
      }

      // Use replace to prevent back-button loops
      navigate("/dashboard/overview", { replace: true });
    } catch (error: any) {
      console.error("Auth Transaction Failed:", error);

      const errorMessage = error.response?.data?.message || error.message || "Authentication Failed";

      if (!error.response && !error.message?.includes("Token")) {
        toast.error("Network Error: Unable to reach Nextaro servers.");
      } else if (errorMessage.includes("User already exists")) {
        toast.error("Identity Conflict: User already exists.");
      } else {
        toast.error(errorMessage);
      }
      setIsLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] overflow-hidden selection:bg-blue-600/10">
      {/* Background Neural Grid Simulation (Pure CSS) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `radial-gradient(#1e293b 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />

      <div className="flex flex-1 flex-col lg:flex-row relative z-10 w-full">

        {/* Left Panel: Brand Narrative (Desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex lg:w-[45%] flex-col justify-between py-12 px-16 xl:py-16 xl:px-24 relative"
        >
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
              <img src={logo} alt="Nextaro" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Nextaro</span>
          </div>

          <div className="space-y-12 max-w-xl">
            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-900 uppercase">Secure Neural Gateway</span>
            </motion.div>

            {/* Hero Titles */}
            <div className="space-y-6">
              <h1 className="text-6xl xl:text-7xl font-black tracking-tighter leading-[1] text-slate-900">
                Master Your <br />
                <span className="text-blue-600 relative inline-block">
                  Professional
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-blue-100 rounded-full" />
                </span> <br />
                Evolution.
              </h1>
              <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed">
                Join the elite network of builders and visionaries using Nextaro to automate career mastery.
              </p>
            </div>

            {/* Trust Cards */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              {[
                { label: "UPTIME", value: <AnimatedCounter target={99.99} suffix="%" />, icon: Zap },
                { label: "SECURITY", value: "AES-256", icon: ShieldCheck }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]"
                >
                  <item.icon className="h-6 w-6 text-blue-600 mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-1">{item.label}</p>
                  <p className="text-3xl font-black text-slate-900">{item.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Professionals Count */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-[#E0EFFF] border-[3px] border-white flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-sm font-bold text-[#64748B]">
                  2,847 active professionals
                </span>
              </div>
            </motion.div>
          </div>

          {/* Footer Meta */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>NEXTARO INTEL V2.0.4</span>
            <div className="flex gap-8">
              <span className="hover:text-blue-600 cursor-pointer transition-colors">PRIVACY</span>
              <span className="hover:text-blue-600 cursor-pointer transition-colors">TERMS</span>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Auth Surface */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-4 xl:p-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-xl bg-white rounded-[3.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.08)] border border-slate-50 min-h-[720px] flex flex-col justify-center"
          >
            <div className={`w-full mx-auto ${isLogin ? 'p-12 md:p-16 space-y-10' : 'p-8 md:p-12 space-y-6'}`}>
              {/* Header Text */}
              <div className={isLogin ? 'space-y-4' : 'space-y-1'}>
                <div className="flex items-center gap-4 text-blue-600">
                  <div className="h-0.5 w-8 bg-current rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    {isLogin ? "IDENTITY VERIFICATION" : "NEW PROTOCOL INITIALIZATION"}
                  </span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                  {isLogin ? "Welcome Back" : "Initiate Protocol"}
                </h1>
                <p className="text-lg text-slate-500 font-medium">
                  {isLogin
                    ? "Access your specialized career intelligence dashboard."
                    : "Start your journey toward professional destiny today."}
                </p>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold transition-all hover:scale-[1.02]">
                  <Github className="h-5 w-5 mr-3" /> GitHub
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold transition-all hover:scale-[1.02]">
                  <Chrome className="h-5 w-5 mr-3" /> Google
                </Button>
              </div>

              <div className={`relative flex items-center ${isLogin ? 'py-4' : 'py-1'}`}>
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credential Layer</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className={isLogin ? 'space-y-6' : 'space-y-3'}>
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <InputField
                        id="full-name"
                        label="FULL NAME"
                        placeholder="e.g. Marcus Aurelius"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 bg-slate-50/30 transition-all font-medium"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <InputField
                  id="email"
                  label="NEURAL ID (EMAIL)"
                  type="email"
                  placeholder="name@sector.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 bg-slate-50/30 transition-all font-medium"
                />

                <InputField
                  id="password"
                  label="SECURITY KEY (PASSWORD)"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 bg-slate-50/30 transition-all font-medium"
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${isLogin ? 'h-16' : 'h-14'} rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest uppercase text-xs shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-95`}
                >
                  {isLoading ? "AUTHENTICATING..." : isLogin ? "LOGIN" : "SIGN UP"}
                </Button>
              </form>

              {/* Mode Toggle */}
              <div className={`text-center ${isLogin ? 'pt-4' : 'pt-2'}`}>
                <p className="text-sm font-bold text-slate-500">
                  {isLogin ? "Expansion required?" : "Existing node?"}{" "}
                  <Link
                    to={isLogin ? "/signup" : "/login"}
                    className="text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4 decoration-2 decoration-blue-100 hover:decoration-blue-300"
                  >
                    {isLogin ? "Sign Up" : "Login"}
                  </Link>
                </p>
              </div>

              {/* Footer Locks */}
              <div className={`flex justify-center gap-1 opacity-20 ${isLogin ? 'pt-10' : 'pt-2'}`}>
                <ShieldCheck className="h-4 w-4" />
                <div className="h-0.5 w-8 bg-slate-900 rounded-full mt-2" />
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest px-12 leading-relaxed">
                Protected by AES-256 Neural Encryption. <br />
                Your data is decentralized and privacy-first.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
