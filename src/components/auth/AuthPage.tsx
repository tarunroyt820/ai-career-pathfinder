import { Button } from "@/components/common/Button";
import { InputField } from "@/components/common/InputField";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Github, ArrowLeft, Mail, Lock } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/images/nextaro-logo.png";

interface AuthPageProps {
  mode: "login" | "signup";
  onNavigate: (view: "landing" | "login" | "signup" | "dashboard") => void;
}

export function AuthPage({ mode, onNavigate }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    setTimeout(() => {
      setIsLoading(false);
      onNavigate("dashboard");
    }, 1000);
  };

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Background aesthetics */}
      <div className="fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute left-[10%] top-[20%] h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo and Back Link */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => onNavigate("landing")}
            className="group mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </button>
          <img
            src={logo}
            alt="Nextaro Logo"
            className="h-14 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
        </div>

        <Card className="rounded-3xl border-border/50 bg-card shadow-2xl shadow-black/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Sign in" : "Sign up"}
            </CardTitle>
            <CardDescription className="text-center">
              Enter your details below to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-11 rounded-xl gap-2 hover:bg-muted/50">
                <Github className="h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" className="h-11 rounded-xl gap-2 hover:bg-muted/50">
                <Chrome className="h-4 w-4" />
                Google
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">
                  Or email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <InputField
                  id="full-name"
                  label="Full Name"
                  placeholder="John Doe"
                  required
                />
              )}
              <InputField
                id="email"
                label="Email address"
                type="email"
                placeholder="name@example.com"
                required
              />
              <InputField
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                required
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-xl text-md font-semibold mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => onNavigate(isLogin ? "signup" : "login")}
                className="font-semibold text-primary hover:text-primary/80"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
            <p className="text-center text-[10px] text-muted-foreground px-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
