import { useState } from "react";
import { Navbar } from "./components/layout/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { TestimonialsSection } from "./components/landing/TestimonialsSection";
import { CTASection } from "./components/landing/CTASection";
import { Footer } from "./components/layout/Footer";
import { AuthPage } from "./components/auth/AuthPage";
import { Dashboard } from "./components/dashboard/Dashboard";

export default function App() {
    const [currentView, setCurrentView] = useState<"landing" | "login" | "signup" | "dashboard">("landing");

    if (currentView === "login" || currentView === "signup") {
        return <AuthPage mode={currentView} onNavigate={setCurrentView} />;
    }

    if (currentView === "dashboard") {
        return <Dashboard onNavigate={setCurrentView} />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar onNavigate={setCurrentView} />
            <main>
                <HeroSection onNavigate={setCurrentView} />
                <FeaturesSection />
                <HowItWorksSection />
                <TestimonialsSection />
                <CTASection onNavigate={setCurrentView} />
            </main>
            <Footer />
        </div>
    );
}
