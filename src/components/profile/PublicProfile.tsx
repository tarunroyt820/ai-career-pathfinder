import { getProfile } from "@/services/profileApi";
import { UserProfile } from "@/types/profile";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Briefcase,
    GraduationCap,
    Award,
    Rocket,
    MapPin,
    Calendar,
    User as UserIcon
} from "lucide-react";

export function PublicProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        getProfile().then(setProfile);
    }, []);

    if (!profile) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Hero Section */}
            <div className="relative h-48 w-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 rounded-3xl overflow-hidden border border-border/50">
                <div className="absolute inset-0 bg-grid-white/5" />
            </div>

            <div className="relative px-4 sm:px-8 -mt-24">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="h-32 w-32 rounded-3xl bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                        <UserIcon className="h-16 w-16 text-primary" />
                    </div>
                    <div className="flex-1 pb-2 space-y-1">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {profile.fullName || "Your Name"}
                            </h1>
                        </div>
                        <p className="text-lg font-medium text-muted-foreground">
                            {profile.jobTitle || "Job Title Not Set"}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4" />
                                {profile.experienceLevel ? (
                                    <span className="capitalize">{profile.experienceLevel} Level</span>
                                ) : (
                                    "Experience Level Not Set"
                                )}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4" />
                                {profile.email || "Email Not Available"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About / Career Goal */}
                    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Rocket className="h-5 w-5 text-primary" />
                                About Me
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                                {profile.careerGoal || "Provide a brief introduction about your career goals in Settings."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Education Section */}
                    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                Education
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {profile.education.college || profile.education.degree ? (
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <GraduationCap className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-foreground leading-none">
                                            {profile.education.college || "Institution Not Specified"}
                                        </h3>
                                        <p className="text-sm text-foreground/80">
                                            {profile.education.degree || "Degree Not Specified"}
                                        </p>
                                        {profile.education.graduationYear && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                Class of {profile.education.graduationYear}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground py-2 italic text-center">
                                    Education details haven't been added yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Skills & Extras */}
                <div className="space-y-8">
                    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Skills & Expertise
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {profile.skills && profile.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-default border border-primary/20"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic text-center py-4 border-2 border-dashed border-border/50 rounded-2xl">
                                    Add your skills in Settings to showcase them here.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Verification Badge */}
                    <div className="p-6 rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Award className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold">Nextro Verified</h4>
                        </div>
                        <p className="text-xs text-primary-foreground/80">
                            This profile is part of the Nextro Career Pathfinder network.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
