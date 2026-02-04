import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { Compass, Target, Map, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/common/ProgressBar";

export function CareerPathShell() {
    const paths = [
        { name: "Frontend Developer", match: 95, status: "Current", active: true },
        { name: "Full-Stack Engineer", match: 80, status: "Recommended", active: false },
        { name: "UI/UX Designer", match: 65, status: "Alternative", active: false },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Career Path Finder</h2>
                    <p className="text-muted-foreground">AI-powered career recommendations based on your skills.</p>
                </div>
                <Button className="gap-2">
                    <Compass className="h-4 w-4" />
                    Retake Assessment
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {paths.map((path) => (
                    <Card key={path.name} className={`rounded-3xl border-border/50 ${path.active ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="bg-primary/10 p-2 rounded-xl">
                                    <Target className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-full">
                                    {path.status}
                                </span>
                            </div>
                            <CardTitle className="mt-4">{path.name}</CardTitle>
                            <CardDescription>{path.match}% Match with your profile</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProgressBar label="Skills Match" value={path.match} showValue />
                            <Button variant="outline" className="w-full mt-4 rounded-xl">View Details</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="rounded-3xl border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5 text-primary" />
                        Active Career Roadmap
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l-2 border-primary/20 ml-4 pb-4 space-y-8">
                        {[
                            { title: "Foundation", status: "Completed", desc: "HTML, CSS, Basic JavaScript" },
                            { title: "Frameworks", status: "In Progress", desc: "React, Tailwind, State Management" },
                            { title: "Advanced Topics", status: "Upcoming", desc: "Testing, Performance, CI/CD" },
                        ].map((step, i) => (
                            <div key={i} className="relative pl-8">
                                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary" />
                                <h4 className="font-bold">{step.title}</h4>
                                <p className="text-sm text-muted-foreground">{step.desc}</p>
                                <span className="text-xs text-primary font-medium">{step.status}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
