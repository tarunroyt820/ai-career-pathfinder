import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/common/Button";
import { BookOpen, Play, CheckCircle, Clock, Star, Zap, ChevronRight, Lock, Trophy } from "lucide-react";
import { ProgressBar } from "@/components/common/ProgressBar";

export function LearningShell() {
    const courses = [
        {
            title: "Advanced React Patterns",
            progress: 45,
            duration: "6h 20m",
            instructor: "Sarah Drasner",
            level: "Intermediate",
            modules: 12,
            completed: 5,
            image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
            status: "active"
        },
        {
            title: "TypeScript for Pro Developers",
            progress: 80,
            duration: "8h 45m",
            instructor: "Josh Goldberg",
            level: "Advanced",
            modules: 15,
            completed: 12,
            image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60",
            status: "active"
        },
        {
            title: "System Architecture & Scalability",
            progress: 10,
            duration: "12h 15m",
            instructor: "Addy Osmani",
            level: "Expert",
            modules: 20,
            completed: 2,
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
            status: "new"
        },
    ];

    const upcoming = [
        { title: "Quantum Computing Basics", level: "Beginner", locked: true },
        { title: "Web3 Engineering", level: "Advanced", locked: true },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                        <Trophy className="h-3 w-3" />
                        Learning Path
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">Your Roadmap</h2>
                    <p className="text-muted-foreground text-lg font-medium max-w-xl">
                        Master the skills needed for your dream career with our curated, AI-powered learning modules.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">Current Goal</p>
                        <p className="text-xl font-black text-foreground">Senior Architect</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg">
                        <Star className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Active Learning Grid */}
            <div className="grid gap-8">
                {courses.map((course, idx) => (
                    <Card key={idx} className="group rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm shadow-xl shadow-black/5 overflow-hidden hover:border-primary/30 transition-all duration-500">
                        <div className="flex flex-col lg:flex-row">
                            {/* Course Image/Poster */}
                            <div className="lg:w-72 h-48 lg:h-auto relative overflow-hidden">
                                <img
                                    src={course.image}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={course.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent lg:hidden" />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                                        {course.level}
                                    </span>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between space-y-8">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-muted-foreground font-bold flex items-center gap-2">
                                            <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                                                {course.instructor.split(' ')[0][0]}
                                            </span>
                                            Instructed by {course.instructor}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/40 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        {course.duration}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold flex items-center gap-2 truncate">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Next Up: <span className="text-foreground">Module {course.completed + 1} of {course.modules}</span>
                                            </span>
                                            <span className="font-black text-primary">{course.progress}% Completed</span>
                                        </div>
                                        <div className="h-3 w-full bg-muted/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient transition-all duration-1000 ease-out"
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <Button className="w-full sm:w-auto rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 group-hover:scale-105 transition-all">
                                            <Play className="h-5 w-5 mr-3 fill-current" />
                                            Continue Session
                                        </Button>
                                        <Button variant="ghost" className="w-full sm:w-auto rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 border border-border/40">
                                            View Syllabus
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Upcoming/Locked Section */}
            <div className="pt-6">
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-black tracking-tight">Future Aspirations</h3>
                    <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {upcoming.map((item, i) => (
                        <div key={i} className="group relative rounded-[2rem] border border-border/40 bg-card/40 p-8 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-foreground">{item.title}</h4>
                                    <span className="inline-block px-3 py-1 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {item.level}
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 border-border/40">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
