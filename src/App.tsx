import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NotFound } from "./components/common/NotFound";
import { Navbar } from "./components/layout/Navbar";
import { HeroSection } from "./components/landing/HeroSection";
import { Footer } from "./components/layout/Footer";
import { AdminRoute } from "./components/auth/AdminRoute";
import { ProtectedRoute, hasValidToken } from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";

const AuthPage = lazy(() => import("./components/auth/AuthPage").then((module) => ({ default: module.AuthPage })));
const VerifyEmailPage = lazy(() => import("./components/auth/VerifyEmailPage").then((module) => ({ default: module.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import("./components/auth/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./components/auth/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage })));
const OnboardingFlow = lazy(() => import("./components/onboarding/OnboardingFlow").then((module) => ({ default: module.OnboardingFlow })));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard").then((module) => ({ default: module.Dashboard })));
const TermsPage = lazy(() => import("./components/skill-exchange/TermsPage").then((module) => ({ default: module.TermsPage })));
const SkillProfileSetupPage = lazy(() => import("./components/skill-exchange/SkillProfileSetupPage").then((module) => ({ default: module.SkillProfileSetupPage })));
const SkillAvailabilityPage = lazy(() => import("./components/skill-exchange/SkillAvailabilityPage").then((module) => ({ default: module.SkillAvailabilityPage })));
const SkillMatchesPage = lazy(() => import("./components/skill-exchange/SkillMatchesPage").then((module) => ({ default: module.SkillMatchesPage })));
const SkillPublicProfilePage = lazy(() => import("./components/skill-exchange/SkillPublicProfilePage").then((module) => ({ default: module.SkillPublicProfilePage })));
const SkillRequestsPage = lazy(() => import("./components/skill-exchange/SkillRequestsPage").then((module) => ({ default: module.SkillRequestsPage })));
const GlobalLearningRequestsPage = lazy(() => import("./components/skill-exchange/GlobalLearningRequestsPage").then((module) => ({ default: module.GlobalLearningRequestsPage })));
const SkillExchangesPage = lazy(() => import("./components/skill-exchange/SkillExchangesPage").then((module) => ({ default: module.SkillExchangesPage })));
const SkillNotificationsPage = lazy(() => import("./components/skill-exchange/SkillNotificationsPage").then((module) => ({ default: module.SkillNotificationsPage })));
const SkillMessagesPage = lazy(() => import("./components/skill-exchange/SkillMessagesPage").then((module) => ({ default: module.SkillMessagesPage })));
const FindPeople = lazy(() => import("./pages/FindPeople"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PricingSection = lazy(() => import("./components/landing/PricingSection").then((module) => ({ default: module.PricingSection })));
const FeaturesSection = lazy(() => import("./components/landing/FeaturesSection").then((module) => ({ default: module.FeaturesSection })));
const HowItWorksSection = lazy(() => import("./components/landing/HowItWorksSection").then((module) => ({ default: module.HowItWorksSection })));
const TestimonialsSection = lazy(() => import("./components/landing/TestimonialsSection").then((module) => ({ default: module.TestimonialsSection })));
const CTASection = lazy(() => import("./components/landing/CTASection").then((module) => ({ default: module.CTASection })));

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    if (hasValidToken()) return <Navigate to="/dashboard/overview" replace />;
    return children;
};

export default function App() {
    const HomePage = () => (
        <>
            <Navbar />
            <main>
                <HeroSection />
                <Suspense fallback={<div className="teal-divider mx-auto max-w-5xl" />}>
                    <FeaturesSection />
                </Suspense>
                <div className="teal-divider mx-auto max-w-5xl" />
                <Suspense fallback={<div className="teal-divider mx-auto max-w-5xl" />}>
                    <HowItWorksSection />
                </Suspense>
                <div className="teal-divider mx-auto max-w-5xl" />
                <Suspense fallback={<div className="teal-divider mx-auto max-w-5xl" />}>
                    <TestimonialsSection />
                </Suspense>
                <div className="teal-divider mx-auto max-w-5xl" />
                <Suspense fallback={<div className="teal-divider mx-auto max-w-5xl" />}>
                    <PricingSection />
                </Suspense>
                <Suspense fallback={<div className="min-h-48" />}>
                    <CTASection />
                </Suspense>
            </main>
            <Footer />
        </>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Toaster position="top-right" />
            <Suspense
                fallback={
                    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
                        Loading...
                    </div>
                }
            >
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><AuthPage mode="signup" /></PublicRoute>} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/profile/:userId" element={<SkillPublicProfilePage />} />

                    {/* Protected Dashboard Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard/*" element={<Dashboard />} />
                        <Route path="/onboarding" element={<OnboardingFlow />} />
                        <Route path="/profile/skills" element={<SkillProfileSetupPage />} />
                        <Route path="/profile/availability" element={<SkillAvailabilityPage />} />
                        <Route path="/matches" element={<SkillMatchesPage />} />
                        <Route path="/discover" element={<FindPeople />} />
                        <Route element={<AdminRoute />}>
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Route>
                        <Route path="/requests" element={<SkillRequestsPage />} />
                        <Route path="/learning-requests" element={<GlobalLearningRequestsPage />} />
                        <Route path="/exchanges" element={<SkillExchangesPage />} />
                        <Route path="/messages" element={<SkillMessagesPage />} />
                        <Route path="/notifications" element={<SkillNotificationsPage />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </div>
    );
}
