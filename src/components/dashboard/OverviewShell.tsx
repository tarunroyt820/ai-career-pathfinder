import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Brain, BookOpen, Users, LineChart, TrendingUp, ChevronRight, Sparkles, Zap, Award } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";

const recentActivity = [
    { action: "Completed Python Basics course", time: "2 hours ago", type: "learning", icon: BookOpen },
    { action: "Matched with mentor: Sarah Chen", time: "5 hours ago", type: "skill", icon: Users },
    { action: "Updated career goals", time: "1 day ago", type: "career", icon: Target },
    { action: "Earned 'Quick Learner' badge", time: "2 days ago", type: "achievement", icon: Award },
];

const recommendedSkills = [
    { name: "Machine Learning", progress: 0, level: "Beginner", demand: "High", color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Data Visualization", progress: 35, level: "Intermediate", demand: "Medium", color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Cloud Computing", progress: 60, level: "Advanced", demand: "High", color: "text-orange-500", bg: "bg-orange-500/10" },
];

export function OverviewShell() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header with quick actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Performance Overview</h2>
                    <p className="text-muted-foreground mt-1 text-lg">Your professional growth at a glance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 px-6 font-semibold border-border/40 hover:bg-muted/50">
                        Generate Report
                    </Button>
                    <Button className="rounded-2xl h-12 px-6 font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Analysis
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Career Match", value: "85%", trend: "+5%", icon: Target, color: "text-primary", bg: "bg-primary/10" },
                    { title: "Skills Mastered", value: "12", trend: "+3", icon: Brain, color: "text-accent", bg: "bg-accent/10" },
                    { title: "Learning Hours", value: "48", trend: "+8h", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Network", value: "24", trend: "+6", icon: Users, color: "text-orange-500", bg: "bg-orange-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm shadow-xl shadow-black/5 hover:translate-y-[-4px] transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black tracking-tight text-foreground">{stat.value}</div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {stat.trend}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground">vs last mo.</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Career Progress Chart Area */}
                <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm shadow-xl shadow-black/5 lg:col-span-8 overflow-hidden">
                    <CardHeader className="p-8">
                        <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <LineChart className="h-6 w-6 text-primary" />
                                Growth Trajectory
                            </CardTitle>
                            <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                ON TRACK
                            </div>
                        </div>
                        <CardDescription className="text-base font-medium">Your pathway to Senior Software Engineer</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-10">
                        <div className="relative pt-2">
                            <ProgressBar label="Overall Career Completion" value={68} showValue className="h-4" />
                            <div className="flex justify-between mt-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Junior</span>
                                <span className="text-primary">Mid-Level</span>
                                <span>Senior</span>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: "Current Node", value: "Backend Specialist", icon: Zap },
                                { label: "Success Rate", value: "94.2%", icon: TrendingUp },
                                { label: "Milestones", value: "18 / 24", icon: Award },
                            ].map((box, i) => (
                                <div key={i} className="group rounded-3xl border border-border/40 bg-muted/20 p-6 transition-all hover:bg-muted/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-xl bg-background/50 text-muted-foreground group-hover:text-primary transition-colors">
                                            <box.icon className="h-5 w-5" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            {box.label}
                                        </p>
                                    </div>
                                    <p className="text-xl font-bold text-foreground">{box.value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm shadow-xl shadow-black/5 lg:col-span-4 flex flex-col">
                    <CardHeader className="p-8">
                        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-accent" />
                            Live Feed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-1">
                        <div className="space-y-8 relative before:absolute before:inset-0 before:left-[19px] before:w-0.5 before:bg-border/40">
                            {recentActivity.map((activity, index) => (
                                <div
                                    key={`activity-${index}`}
                                    className="relative flex items-start gap-5 group"
                                >
                                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card border border-border/50 shadow-sm group-hover:scale-110 transition-transform">
                                        <activity.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                            {activity.action}
                                        </p>
                                        <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-tighter">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-10 rounded-2xl font-bold text-muted-foreground hover:bg-muted/50 group">
                            Full Activity
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recommended Section */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-[3rem] blur-3xl -z-10" />
                <Card className="rounded-[3rem] border-border/40 bg-card/80 backdrop-blur-md shadow-2xl shadow-black/5 overflow-hidden">
                    <CardHeader className="p-10 pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-accent/20">
                                    <Brain className="h-8 w-8 text-accent" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-3xl font-black tracking-tight text-foreground">AI Recommendations</CardTitle>
                                    <CardDescription className="text-lg font-medium">Smart skill suggestions to accelerate your path</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-border bg-transparent hover:bg-muted/50 transition-all">
                                Refresh Recommendations
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {recommendedSkills.map((skill, i) => (
                                <div
                                    key={i}
                                    className="group relative rounded-[2.5rem] border border-border/40 bg-background/50 p-8 transition-all hover:bg-background hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`p-3 rounded-2xl ${skill.bg}`}>
                                            <Zap className={`h-6 w-6 ${skill.color}`} />
                                        </div>
                                        <span
                                            className="rounded-full bg-green-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-500"
                                        >
                                            {skill.demand} Demand
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-black text-foreground mb-1 group-hover:text-primary transition-colors">{skill.name}</h4>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none">{skill.level}</p>

                                    <div className="mt-8 space-y-4">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-black uppercase text-muted-foreground">Mastery</span>
                                            <span className="text-sm font-black text-foreground">{skill.progress}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                                                style={{ width: `${skill.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="mt-8 w-full rounded-[1.25rem] h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/10 hover:shadow-primary/20 group-hover:scale-[1.02] transition-all"
                                    >
                                        {skill.progress === 0 ? "Enroll Now" : "Resume Learning"}
                                        <Sparkles className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
