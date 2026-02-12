import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { TestimonialsSection } from "./components/landing/TestimonialsSection";
import { CTASection } from "./components/landing/CTASection";
import { Footer } from "./components/layout/Footer";
import { AuthPage } from "./components/auth/AuthPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("nextro_token");
    if (token) return <Navigate to="/dashboard/overview" replace />;
    return children;
};

export default function App() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Toaster position="top-right" />
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/"
                    element={
                        <>
                            <Navbar />
                            <main>
                                <HeroSection />
                                <FeaturesSection />
                                <HowItWorksSection />
                                <TestimonialsSection />
                                <CTASection />
                            </main>
                            <Footer />
                        </>
                    }
                />
                <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />

                {/* Protected Dashboard Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard/*" element={<Dashboard />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
