import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Brain, BookOpen, Users, LineChart, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ProgressBar } from "@/components/common/ProgressBar";

const recentActivity = [
    { action: "Completed Python Basics course", time: "2 hours ago", type: "learning" },
    { action: "Matched with mentor: Sarah Chen", time: "5 hours ago", type: "skill" },
    { action: "Updated career goals", time: "1 day ago", type: "career" },
    { action: "Earned 'Quick Learner' badge", time: "2 days ago", type: "achievement" },
];

const recommendedSkills = [
    { name: "Machine Learning", progress: 0, level: "Beginner", demand: "High" },
    { name: "Data Visualization", progress: 35, level: "Intermediate", demand: "Medium" },
    { name: "Cloud Computing", progress: 60, level: "Advanced", demand: "High" },
];

export function OverviewShell() {
    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Career Match
                        </CardTitle>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">85%</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-green-600">+5%</span> from last week
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Skills Mastered
                        </CardTitle>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                            <Brain className="h-5 w-5 text-accent-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">12</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-green-600">+3</span> this month
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Learning Hours
                        </CardTitle>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                            <BookOpen className="h-5 w-5 text-secondary-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">48</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-green-600">+8</span> this week
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Connections
                        </CardTitle>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10">
                            <Users className="h-5 w-5 text-chart-1" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">24</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-green-600">+6</span> new mentors
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Career Progress */}
                <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <LineChart className="h-5 w-5 text-primary" />
                            </div>
                            Career Progress
                        </CardTitle>
                        <CardDescription className="text-base">Your journey to Full-Stack Developer</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ProgressBar label="Overall Progress" value={65} showValue />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Current Phase
                                </p>
                                <p className="mt-2 text-lg font-bold text-foreground">Skill Building</p>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Next Milestone
                                </p>
                                <p className="mt-2 text-lg font-bold text-foreground">Backend Mastery</p>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Est. Completion
                                </p>
                                <p className="mt-2 text-lg font-bold text-foreground">6 months</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                                <TrendingUp className="h-5 w-5 text-accent-foreground" />
                            </div>
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div
                                    key={`activity-${index}`}
                                    className="flex items-start gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommended Skills */}
            <Card className="rounded-3xl border-border/50 bg-card shadow-lg shadow-black/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Brain className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Recommended Skills</CardTitle>
                                <CardDescription className="text-base">Based on your career goals</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 rounded-xl bg-transparent">
                            View All
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recommendedSkills.map((skill) => (
                            <div
                                key={skill.name}
                                className="rounded-2xl border border-border/50 bg-muted/30 p-5 transition-all hover:border-primary/20 hover:shadow-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-foreground">{skill.name}</h4>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${skill.demand === "High"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-700"
                                            }`}
                                    >
                                        {skill.demand} Demand
                                    </span>
                                </div>
                                <p className="mt-1.5 text-sm text-muted-foreground">{skill.level}</p>
                                <div className="mt-4">
                                    <ProgressBar label="Progress" value={skill.progress} showValue />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-5 w-full rounded-xl bg-transparent text-primary hover:bg-primary/5"
                                >
                                    {skill.progress === 0 ? "Start Learning" : "Continue"}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
