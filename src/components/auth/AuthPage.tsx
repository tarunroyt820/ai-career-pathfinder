import { Button } from "@/components/common/Button";
import { InputField } from "@/components/common/InputField";
import { Chrome, Github, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, signup } from "@/services/authApi";
import { toast } from "sonner";
import { Logo } from "@/components/common/Logo";
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
  const [joinSkillExchange, setJoinSkillExchange] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const response = await signup(fullName, email, password, joinSkillExchange);
        toast.success(response.message || "Account created. Check your inbox for the OTP.");
        navigate("/verify-email", { replace: true, state: { verificationEmail: email } });
        return;
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
      const statusCode = error.response?.status;

      if (!error.response && !error.message?.includes("Token")) {
        toast.error("Network or CORS error: check that the backend is running and the frontend URL is allowed.");
      } else if (statusCode === 503) {
        toast.error("The backend is online, but the database is still reconnecting. Try again in a moment.");
      } else if (statusCode === 429) {
        toast.error("Too many attempts. Please wait a few minutes, then try again.");
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
    <div className="flex min-h-screen overflow-hidden selection:bg-[#16A085]/10" style={{ background: 'var(--bg-primary)' }}>
      {/* Background Neural Grid Simulation (Pure CSS) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `radial-gradient(rgba(22,160,133,0.3) 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />

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
            <Logo size="md" onClick={() => navigate("/")} />
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Nextaro</span>
          </div>

          <div className="space-y-12 max-w-xl">
            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}
            >
              <ShieldCheck className="h-4 w-4" style={{ color: 'var(--color-teal)' }} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-primary)' }}>Secure Neural Gateway</span>
            </motion.div>

            {/* Hero Titles */}
            <div className="space-y-6">
              <h1 className="text-6xl xl:text-7xl font-black tracking-tighter leading-[1]" style={{ color: 'var(--text-primary)' }}>
                Master Your <br />
                <span className="relative inline-block" style={{ color: 'var(--color-teal)' }}>
                  Professional
                  <span className="absolute -bottom-2 left-0 w-full h-1 rounded-full" style={{ background: 'var(--color-teal-light)' }} />
                </span> <br />
                Evolution.
              </h1>
              <p className="text-lg font-medium max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
                  className="p-8 rounded-[2rem] transition-shadow"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderWidth: '1px', boxShadow: 'var(--shadow-card)' }}
                >
                  <item.icon className="h-6 w-6 mb-4" style={{ color: 'var(--color-teal)' }} />
                  <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
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
                  <div key={i} className="size-10 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'var(--color-teal-light)', borderColor: 'var(--bg-primary)', borderWidth: '3px' }}>
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--color-teal)' }} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ background: 'var(--color-teal)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  2,847 active professionals
                </span>
              </div>
            </motion.div>
          </div>

          {/* Footer Meta */}
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            <span>NEXTARO INTEL V2.0.4</span>
            <div className="flex gap-8">
              <span className="cursor-pointer transition-colors" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-teal)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>PRIVACY</span>
              <span className="cursor-pointer transition-colors" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-teal)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>TERMS</span>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Auth Surface */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-4 xl:p-8 relative">
          {/* Mobile Logo - shows on mobile only */}
          <div className="flex lg:hidden items-center justify-center mb-6">
                  <Logo size="md" onClick={() => navigate("/")} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-xl bg-[rgba(20,37,62,0.60)] rounded-[2rem] md:rounded-[3.5rem] border border-[rgba(22,160,133,0.20)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.40)] min-h-auto md:min-h-[720px] flex flex-col justify-center"
          >
            <div className={`w-full mx-auto ${isLogin ? 'p-6 md:p-12 lg:p-16 space-y-6 md:space-y-10' : 'p-6 md:p-8 lg:p-12 space-y-4 md:space-y-6'}`}>
              {/* Header Text */}
              <div className={isLogin ? 'space-y-4' : 'space-y-1'}>
                <div className="flex items-center gap-4" style={{ color: 'var(--color-teal)' }}>
                  <div className="h-0.5 w-8 bg-current rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                    {isLogin ? "IDENTITY VERIFICATION" : "NEW PROTOCOL INITIALIZATION"}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-[0.9]">
                  {isLogin ? "Welcome Back" : "Initiate Protocol"}
                </h1>
                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {isLogin
                    ? "Access your specialized career intelligence dashboard."
                    : "Start your journey toward professional destiny today."}
                </p>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 md:h-14 rounded-2xl border-[rgba(22,160,133,0.30)] bg-[rgba(20,37,62,0.80)] text-[#BDD8E9] hover:bg-[rgba(22,160,133,0.10)] font-bold transition-all">
                  <Github className="h-5 w-5 mr-3" /> GitHub
                </Button>
                <Button variant="outline" className="h-12 md:h-14 rounded-2xl border-[rgba(22,160,133,0.30)] bg-[rgba(20,37,62,0.80)] text-[#BDD8E9] hover:bg-[rgba(22,160,133,0.10)] font-bold transition-all">
                  <Chrome className="h-5 w-5 mr-3" /> Google
                </Button>
              </div>

              <div className={`relative flex items-center ${isLogin ? 'py-4' : 'py-1'}`}>
                <div className="flex-grow border-t" style={{ borderColor: 'var(--border-subtle)' }}></div>
                <span className="text-[rgba(189,216,233,0.40)] text-xs tracking-widest font-bold mx-4">Credential Layer</span>
                <div className="flex-grow border-t" style={{ borderColor: 'var(--border-subtle)' }}></div>
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
                />

                <InputField
                  id="password"
                  label="SECURITY KEY (PASSWORD)"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {!isLogin && (
                  <label className="flex items-start gap-2 rounded-xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-3 text-xs text-[rgba(189,216,233,0.85)]">
                    <input
                      type="checkbox"
                      checked={joinSkillExchange}
                      onChange={(e) => setJoinSkillExchange(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[rgba(22,160,133,0.4)] bg-transparent"
                    />
                    <span>
                      Join Skill Exchange.
                      {" "}
                      <Link to="/terms" className="font-bold text-[#16A085] underline underline-offset-4">
                        Read terms
                      </Link>
                    </span>
                  </label>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${isLogin ? 'h-14 md:h-16' : 'h-12 md:h-14'} rounded-2xl bg-[#16A085] hover:bg-[#168777] text-white font-black tracking-widest uppercase text-xs shadow-xl shadow-[rgba(22,160,133,0.30)] transition-all`}
                >
                  {isLoading ? "AUTHENTICATING..." : isLogin ? "LOGIN" : "SIGN UP"}
                </Button>
              </form>

              {/* Mode Toggle */}
              <div className={`text-center ${isLogin ? 'pt-3 md:pt-4' : 'pt-2 md:pt-3'}`}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {isLogin ? "Expansion required?" : "Existing node?"}{" "}
                  <Link
                    to={isLogin ? "/signup" : "/login"}
                    className="transition-colors underline underline-offset-4 decoration-2"
                    style={{ color: 'var(--color-teal)' }}
                  >
                    {isLogin ? "Sign Up" : "Login"}
                  </Link>
                </p>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="mt-4 inline-block text-sm font-bold underline underline-offset-4 decoration-2 transition-colors"
                    style={{ color: 'var(--color-teal)' }}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>

              {/* Footer Locks */}
              <div className={`flex justify-center gap-1 opacity-20 ${isLogin ? 'pt-6 md:pt-10' : 'pt-2 md:pt-3'}`} style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck className="h-4 w-4" />
                <div className="h-0.5 w-8 rounded-full mt-2" style={{ background: 'rgba(22,160,133,0.40)' }} />
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-center uppercase tracking-widest px-6 md:px-12 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
