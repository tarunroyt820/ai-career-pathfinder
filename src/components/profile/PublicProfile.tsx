import { getEnhancedProfile } from "@/services/enhancedProfileApi";
import { EnhancedProfile } from "@/types/enhancedProfile";
import { useState, useEffect } from "react";
import { getPublicProfile } from "@/services/profileApi";
import { getSkillProfile, getReviews, Review, SkillProfile } from "@/services/skillExchangeApi";
import { RequestExchangeModal } from "@/components/skill-exchange/RequestExchangeModal";
import type { UserProfile } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Briefcase,
    GraduationCap,
    Award,
    Rocket,
    Globe,
    Calendar,
    User as UserIcon,
    ShieldCheck,
    Linkedin,
    Twitter,
    Github,
    Sparkles,
    MapPin,
    Link as LinkIcon,
    Wrench,
    Target
} from "lucide-react";

export function PublicProfile({ userId }: { userId?: string }) {
    const [profile, setProfile] = useState<any | null>(null);
    const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                if (userId) {
                    const [pub, skill, revs] = await Promise.all([
                        getPublicProfile(userId),
                        getSkillProfile(userId),
                        getReviews(userId),
                    ]);
                    if (!mounted) return;
                    setProfile(pub as UserProfile);
                    setSkillProfile(skill);
                    setReviews(revs);
                } else {
                    const enhanced = await getEnhancedProfile();
                    if (!mounted) return;
                    setProfile(enhanced as EnhancedProfile);
                }
            } catch (err) {
                // swallow errors; caller may show fallback
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [userId]);

    if (loading || !profile) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const initials = (profile?.fullName || "").split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || "JD";

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
            {/* Immersive Profile Hero */}
            <div className="relative">
                {/* Banner */}
                <div className="relative h-64 w-full bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-gradient rounded-[3rem] overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] mix-blend-overlay" />
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Profile Info Overlay */}
                <div className="relative px-8 lg:px-16 -mt-24">
                    <div className="flex flex-col md:flex-row gap-10 items-end">
                        <div className="group relative">
                            <div className="h-44 w-44 rounded-[2.5rem] bg-card p-1.5 shadow-2xl shadow-black/10 border border-white/20 ring-8 ring-background">
                                <div className="h-full w-full rounded-[2.2rem] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                                    <span className="text-4xl font-black text-primary">{initials}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-4 h-10 w-10 bg-green-500 rounded-2xl border-4 border-background flex items-center justify-center shadow-lg">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 pb-6 space-y-3">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                                    {profile.fullName}
                                </h1>
                                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                                    Pro Tier
                                </span>
                            </div>
                                <p className="text-xl font-bold text-muted-foreground leading-none">
                                {(profile.visibility?.jobTitle ?? true) ? (profile.jobTitle || "Nextaro Professional") : "Private"}
                            </p>
                            <div className="flex flex-wrap gap-5 pt-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    {profile.experienceLevel || "Explorer"}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    <Target className="h-4 w-4 text-primary" />
                                    {(profile.visibility?.targetRole ?? true) ? (profile.targetRole || "Target Role Pending") : "Private"}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    <Globe className="h-4 w-4 text-primary" />
                                    Global Network
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    <Mail className="h-4 w-4 text-primary" />
                                    Contact Locked
                                </div>
                            </div>
                        </div>

                        <div className="pb-6 flex gap-3">
                                {[Linkedin, Twitter, Github].map((Icon, i) => (
                                <button type="button" key={Icon?.name || i} className="h-12 w-12 rounded-2xl bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all shadow-sm">
                                    <Icon className="h-5 w-5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:px-6">
                {/* Main Body */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Mission Section */}
                    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="p-10 pb-6">
                            <CardTitle className="text-2xl font-black flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Rocket className="h-6 w-6 text-primary" />
                                </div>
                                Mission Statement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 pb-10">
                            <div className="relative">
                                <div className="absolute -left-6 -top-2 text-6xl text-primary/10 font-serif leading-none italic">"</div>
                                <p className="text-lg md:text-xl font-bold text-muted-foreground leading-relaxed italic">
                                    {profile.careerGoal || "This professional is currently crafting their mission statement."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="p-10 pb-6">
                            <CardTitle className="text-2xl font-black flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Target className="h-6 w-6 text-primary" />
                                </div>
                                AI Career Context
                            </CardTitle>
                            <CardDescription className="text-base font-medium">
                                Temporary preview data that will later help AI personalize job-role guidance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-10 pb-10 md:grid-cols-2">
                            <div className="space-y-2 rounded-[1.5rem] border border-border/40 bg-muted/20 p-5">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Target Role</p>
                                <p className="text-lg font-black text-foreground">{profile.targetRole || "Not added yet"}</p>
                            </div>
                            <div className="space-y-2 rounded-[1.5rem] border border-border/40 bg-muted/20 p-5">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Years Of Experience</p>
                                <p className="text-lg font-black text-foreground">{profile.yearsOfExperience || "Not added yet"}</p>
                            </div>
                            <div className="space-y-2 rounded-[1.5rem] border border-border/40 bg-muted/20 p-5">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Preferred Industry</p>
                                <p className="text-lg font-black text-foreground">{profile.preferredIndustry || "Not added yet"}</p>
                            </div>
                            <div className="space-y-2 rounded-[1.5rem] border border-border/40 bg-muted/20 p-5">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Work Preference</p>
                                <p className="text-lg font-black text-foreground">{profile.workPreference || "Not added yet"}</p>
                            </div>
                            <div className="space-y-2 rounded-[1.5rem] border border-border/40 bg-muted/20 p-5 md:col-span-2">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Summary</p>
                                <p className="text-base font-semibold leading-relaxed text-muted-foreground">
                                    {profile.aiSummary || "No AI-ready summary has been added yet."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Educational Journey */}
                    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="p-10 pb-6">
                            <CardTitle className="text-2xl font-black flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                    <GraduationCap className="h-6 w-6 text-accent" />
                                </div>
                                Academic Background
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 space-y-8">
                                    {Array.isArray(profile.education) && profile.education.length > 0 ? (
                                        profile.education.map((edu: any, i: number) => (
                                            <div key={i} className="flex gap-8 group">
                                                <div className="h-20 w-20 rounded-3xl bg-muted/30 border border-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                    <GraduationCap className="h-10 w-10 text-primary/50" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                                                        {edu.college || "Global University"}
                                                    </h3>
                                                    <p className="text-lg font-bold text-primary">{edu.degree || "Bachelor of Science"}</p>
                                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        Class of {edu.graduationYear || "2024"}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground font-medium text-center py-10 opacity-50">Educational records not yet synchronized.</p>
                                    )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Skills Radar */}
                    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Award className="h-5 w-5 text-primary" />
                                Core Expertise
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                                    {(profile.skills || []).length > 0 ? (
                                        <div className="flex flex-wrap gap-2.5">
                                    {(profile.skills || []).map((skill: string) => (
                                            <Badge
                                                key={skill}
                                                className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-default border-none shadow-sm"
                                            >
                                                {skill}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-border/40 rounded-3xl space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inventory Empty</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <Wrench className="h-5 w-5 text-primary" />
                                AI Readiness Snapshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 px-8 pb-8">
                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tools</p>
                                <div className="flex flex-wrap gap-2.5">
                                        {(profile.tools || []).length > 0 ? (profile.tools || []).map((tool: string) => (
                                        <Badge
                                            key={tool}
                                            className="rounded-2xl border-none bg-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-accent"
                                        >
                                            {tool}
                                        </Badge>
                                    )) : (
                                        <span className="text-sm font-medium text-muted-foreground">No tools added yet</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Certifications</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {(profile.certifications || []).length > 0 ? (profile.certifications || []).map((item: string) => (
                                        <Badge
                                            key={item}
                                            className="rounded-2xl border-none bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-primary"
                                        >
                                            {item}
                                        </Badge>
                                    )) : (
                                        <span className="text-sm font-medium text-muted-foreground">No certifications added yet</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Strengths</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {(profile.strengths || []).length > 0 ? (profile.strengths || []).map((item: string) => (
                                        <Badge
                                            key={item}
                                            className="rounded-2xl border-none bg-green-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-green-500"
                                        >
                                            {item}
                                        </Badge>
                                    )) : (
                                        <span className="text-sm font-medium text-muted-foreground">No strengths added yet</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Improvement Areas</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {(profile.improvementAreas || []).length > 0 ? (profile.improvementAreas || []).map((item: string) => (
                                        <Badge
                                            key={item}
                                            className="rounded-2xl border-none bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-amber-500"
                                        >
                                            {item}
                                        </Badge>
                                    )) : (
                                        <span className="text-sm font-medium text-muted-foreground">No improvement areas added yet</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <LinkIcon className="h-5 w-5 text-primary" />
                                Links & Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 px-8 pb-8">
                            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                {profile.preferredLocation || "Preferred location not added yet"}
                            </div>
                            <div className="space-y-2">
                                {[profile.portfolioUrl, profile.linkedinUrl, profile.githubUrl].filter(Boolean).length > 0 ? (
                                    [profile.portfolioUrl, profile.linkedinUrl, profile.githubUrl].filter(Boolean).map((link) => (
                                        <a
                                            key={link}
                                            href={link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block break-all text-sm font-bold text-primary transition-opacity hover:opacity-80"
                                        >
                                            {link}
                                        </a>
                                    ))
                                ) : (
                                    <p className="text-sm font-medium text-muted-foreground">No portfolio links added yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Endorsement */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/20 space-y-6 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-1000" style={{ background: 'rgba(22,160,133,0.15)' }} />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="font-black text-xl text-white tracking-tight">AI Endorsed</h4>
                        </div>
                        <p className="relative z-10 text-sm font-bold text-white/90 leading-relaxed">
                            Based on network interactions and skills, this profile is categorized as a Top 5% high-potential talent in the Nextaro ecosystem.
                        </p>
                        <div className="relative z-10 pt-2 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/70">
                            <span>Reliability Score</span>
                            <span>98.4 / 100</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
