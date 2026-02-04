import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { BookOpen, Play, CheckCircle, Clock } from "lucide-react";
import { ProgressBar } from "@/components/common/ProgressBar";

export function LearningShell() {
    const courses = [
        { title: "Advanced React Patterns", progress: 45, duration: "6h 20m", instructor: "Colt Steele" },
        { title: "TypeScript Masterclass", progress: 80, duration: "8h 45m", instructor: "Josh Comeau" },
        { title: "Node.js Backend Essentials", progress: 10, duration: "12h 15m", instructor: "Angela Yu" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Learning Roadmap</h2>
                <p className="text-muted-foreground">Step-by-step learning modules tailored to your goals.</p>
            </div>

            <div className="grid gap-6">
                {courses.map((course) => (
                    <Card key={course.title} className="rounded-3xl border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-4">
                                <div className="bg-accent/10 p-3 rounded-2xl">
                                    <BookOpen className="h-6 w-6 text-accent-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{course.title}</CardTitle>
                                    <CardDescription>Instructor: {course.instructor}</CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-xl">
                                {course.progress === 0 ? "Start" : "Continue"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex-1">
                                    <ProgressBar label="Course Progress" value={course.progress} showValue />
                                </div>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {course.duration}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        {Math.round(course.progress / 10)} / 10 lessons
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
