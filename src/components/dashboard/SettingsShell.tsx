import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { User, Bell, Shield, Keyboard, Info, Globe, Mail, Lock, CheckCircle2, AlertTriangle, Eye, Zap, RefreshCw } from "lucide-react";
import { InputField } from "@/components/common/InputField";
import { TextareaField } from "@/components/common/TextareaField";
import { SelectField } from "@/components/common/SelectField";
import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "@/services/profileApi";
import { UserProfile } from "@/types/profile";
import { toast } from "sonner";

export function SettingsShell() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        getProfile().then(setProfile);
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            await updateProfile(profile);
            toast.success("Settings saved successfully!");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof UserProfile, value: string) => {
        if (!profile) return;
        setProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    if (!profile) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "account", label: "Account", icon: Mail },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "privacy", label: "Privacy & Security", icon: Shield },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight">System Settings</h2>
                    <p className="text-muted-foreground text-lg font-medium">Control your Nextaro experience and data.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-border/40">
                        Discard
                    </Button>
                    <Button
                        className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Syncing..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    {activeTab === "profile" && (
                        <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                            <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                                <CardTitle className="text-2xl font-black">Professional Identity</CardTitle>
                                <CardDescription className="text-base font-medium">Your public persona on the Nextaro network.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="flex flex-col items-center sm:flex-row gap-8">
                                    <div className="relative group">
                                        <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary to-accent p-1 shadow-xl">
                                            <div className="h-full w-full rounded-[1.8rem] bg-card flex items-center justify-center font-black text-2xl text-primary">
                                                {profile.fullName?.[0]}
                                            </div>
                                        </div>
                                        <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-background border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                            <Globe className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="text-center sm:text-left space-y-1">
                                        <h3 className="text-xl font-black">{profile.fullName}</h3>
                                        <p className="text-muted-foreground font-medium">Member since February 2026</p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Profile
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                                Elite Network
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <InputField
                                        label="Display Name"
                                        value={profile.fullName}
                                        onChange={(e) => handleChange("fullName", e.target.value)}
                                        className="h-14 rounded-2xl"
                                    />
                                    <InputField
                                        label="Professional Title"
                                        placeholder="e.g. Senior Frontend Engineer"
                                        value={profile.jobTitle || ""}
                                        onChange={(e) => handleChange("jobTitle", e.target.value)}
                                        className="h-14 rounded-2xl"
                                    />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <SelectField
                                        label="Expertise Level"
                                        placeholder="Select your level"
                                        options={[
                                            { label: "Beginner", value: "beginner" },
                                            { label: "Intermediate", value: "intermediate" },
                                            { label: "Senior", value: "senior" },
                                            { label: "Lead / Architect", value: "lead" },
                                        ]}
                                        value={profile.experienceLevel || "beginner"}
                                        onChange={(value) => handleChange("experienceLevel", value)}
                                    />
                                    <InputField
                                        label="Primary Focus"
                                        placeholder="e.g. AI & Machine Learning"
                                        value={profile.skills?.[0] || ""}
                                        onChange={(e) => handleChange("skills", e.target.value)} // Simplified for UI
                                        className="h-14 rounded-2xl"
                                    />
                                </div>

                                <TextareaField
                                    label="Mission Statement"
                                    placeholder="What drives your professional engine?"
                                    rows={4}
                                    value={profile.careerGoal}
                                    onChange={(e) => handleChange("careerGoal", e.target.value)}
                                    className="rounded-[1.5rem] bg-background/50"
                                />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === "notifications" && (
                        <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                            <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                                <CardTitle className="text-2xl font-black">Alert Configuration</CardTitle>
                                <CardDescription className="text-base font-medium">Manage how you receive real-time updates.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {[
                                    { label: "AI Progress Alerts", desc: "Get notified when the AI discovers a new career milestone for you.", icon: Zap },
                                    { label: "Skill Exchange Matches", desc: "Real-time alerts when a high-priority skill match is found.", icon: RefreshCw },
                                    { label: "Security & Login Activity", desc: "Important updates regarding your account security.", icon: Lock },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-muted/30 border border-border/40 group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <item.icon className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-lg font-black text-foreground">{item.label}</p>
                                                <p className="text-sm font-medium text-muted-foreground max-w-md">{item.desc}</p>
                                            </div>
                                        </div>
                                        <button className="h-8 w-14 bg-primary rounded-full relative shadow-inner">
                                            <div className="absolute right-1 top-1 h-6 w-6 bg-white rounded-full shadow-md" />
                                        </button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {(activeTab === "privacy" || activeTab === "account") && (
                        <div className="h-96 rounded-[2.5rem] border-2 border-dashed border-border/40 flex flex-col items-center justify-center space-y-4 p-12 text-center bg-muted/10">
                            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h3>
                            <p className="text-muted-foreground font-medium max-w-xs">
                                These settings require a primary administrative key to modify. Contact your organization lead.
                            </p>
                            <Button variant="outline" className="rounded-xl mt-4 px-8 font-black uppercase tracking-widest gap-2">
                                <Eye className="h-4 w-4" /> View Documentation
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
