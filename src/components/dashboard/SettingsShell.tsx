import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { User, Bell, Shield, Keyboard, Info } from "lucide-react";
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

    useEffect(() => {
        getProfile().then(setProfile);
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            await updateProfile(profile);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
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
            <div className="flex h-48 w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-6">
                <Card className="rounded-3xl border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal and professional details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <InputField
                                label="Full Name"
                                value={profile.fullName}
                                onChange={(e) => handleChange("fullName", e.target.value)}
                            />
                            <InputField
                                label="Email Address"
                                value={profile.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <InputField
                                label="Job Title"
                                value={profile.jobTitle || ""}
                                onChange={(e) => handleChange("jobTitle", e.target.value)}
                            />
                            <SelectField
                                label="Experience Level"
                                placeholder="Select level"
                                options={[
                                    { label: "Beginner", value: "beginner" },
                                    { label: "Intermediate", value: "intermediate" },
                                    { label: "Senior", value: "senior" },
                                ]}
                                value={profile.experienceLevel || "beginner"}
                                onChange={(value) => handleChange("experienceLevel", value)}
                            />
                        </div>

                        <TextareaField
                            label="Professional Bio"
                            placeholder="Tell us about your career goals..."
                            rows={4}
                            value={profile.careerGoal}
                            onChange={(e) => handleChange("careerGoal", e.target.value)}
                        />

                        <Button className="rounded-xl w-fit px-8" onClick={handleSave}>Save Changes</Button>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-accent-foreground" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Configure how you receive updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-2">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Email Notifications</p>
                                <p className="text-xs text-muted-foreground">Receive updates about your career path via email.</p>
                            </div>
                            <div className="h-6 w-11 bg-primary rounded-full relative">
                                <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-2">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Skill Match Alerts</p>
                                <p className="text-xs text-muted-foreground">Get notified when someone matches your skill exchange needs.</p>
                            </div>
                            <div className="h-6 w-11 bg-muted rounded-full relative">
                                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
