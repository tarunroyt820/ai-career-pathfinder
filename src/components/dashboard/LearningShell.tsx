import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, Star, Trophy } from "lucide-react";

import { Button } from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCareerPlan } from "@/services/careerPlanApi";
import { fetchCourseCategories, CourseCategory } from "@/services/courseCategoryApi";
import { fetchFeaturedCourses, CourseItem } from "@/services/courseApi";
import { CareerPlan } from "@/types/careerPlan";

const fallbackThumbnail = "/images/feature-curated-learning.jpg";

export function LearningShell() {
    const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
    const [featuredCourses, setFeaturedCourses] = useState<CourseItem[]>([]);
    const [categories, setCategories] = useState<CourseCategory[]>([]);

    useEffect(() => {
        getCareerPlan().then((plan) => setCareerPlan(plan)).catch(() => {});
        fetchFeaturedCourses().then((response) => setFeaturedCourses(response.data)).catch(() => {});
        fetchCourseCategories().then((response) => setCategories(response.data.slice(0, 6))).catch(() => {});
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
                        <Trophy className="h-3 w-3" />
                        Learning Hub
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">Curated learning for your next move</h2>
                    <p className="max-w-xl text-lg font-medium text-muted-foreground">
                        Explore trusted external courses, tutorials, and docs that support your target career path without turning NEXTARO into an LMS.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">Current Goal</p>
                        <p className="text-xl font-black text-foreground">{careerPlan?.careerGoal || "Career Growth"}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                        <Star className="h-6 w-6" />
                    </div>
                </div>
            </div>

            <div className="grid gap-8">
                <Card className="rounded-[2.5rem] border-border/40 bg-card/60 backdrop-blur-sm">
                    <CardHeader className="p-8">
                        <CardTitle className="flex items-center gap-3">
                            <BookOpen className="h-6 w-6 text-primary" />
                            Plan-Based Learning Recommendations
                        </CardTitle>
                        <CardDescription>
                            {careerPlan ? `Resources and skills aligned with ${careerPlan.careerGoal}` : "Complete Career Path setup to get learning guidance matched to your goals."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8 pt-0">
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recommended Skills</h4>
                            <div className="mt-3 grid gap-3">
                                {careerPlan?.recommendedSkills?.length ? (
                                    careerPlan.recommendedSkills.map((skill, index) => (
                                        <div key={`${skill}-${index}`} className="rounded-2xl bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground">
                                            {skill}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                        Complete Career Path setup to see your learning recommendations.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Weekly Tasks</h4>
                            <div className="mt-3 grid gap-3">
                                {careerPlan?.weeklyTasks?.length ? (
                                    careerPlan.weeklyTasks.map((task, index) => (
                                        <div key={`${task}-${index}`} className="rounded-2xl bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground">
                                            {task}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                        Generate a career plan to see your suggested study actions.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Popular Categories</h4>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {categories.length ? (
                                    categories.map((category) => (
                                        <div key={category._id} className="rounded-2xl bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                                            {category.name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                        Categories will appear here once the course hub is populated.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <Button asChild className="rounded-2xl px-6 font-black uppercase tracking-widest">
                                <Link to="/courses">Explore Course Library</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {featuredCourses.map((course) => (
                    <Card key={course._id} className="group overflow-hidden rounded-[2.5rem] border-border/40 bg-card/60 shadow-xl shadow-black/5 transition-all duration-500 hover:border-primary/30">
                        <div className="flex flex-col lg:flex-row">
                            <div className="relative h-48 overflow-hidden lg:h-auto lg:w-72">
                                <img
                                    src={course.thumbnailUrl || fallbackThumbnail}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={course.title}
                                    onError={(event) => {
                                        event.currentTarget.src = fallbackThumbnail;
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent lg:hidden" />
                                <div className="absolute left-4 top-4">
                                    <span className="rounded-lg bg-primary/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                                        {course.difficulty}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-between space-y-8 p-8 lg:p-10">
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                                            {course.title}
                                        </h3>
                                        <p className="flex items-center gap-2 font-bold text-muted-foreground">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px]">
                                                {course.instructor.split(" ")[0]?.[0] || "N"}
                                            </span>
                                            Instructed by {course.instructor}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-muted/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        {course.durationLabel}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="leading-7 text-muted-foreground">{course.shortDescription}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">{course.categoryName}</Badge>
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{course.platform}</Badge>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                                        <Button asChild className="h-14 w-full rounded-2xl px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 group-hover:scale-105 sm:w-auto">
                                            <Link to={`/courses/${course.slug}`}>View Resource</Link>
                                        </Button>
                                        <Button asChild variant="ghost" className="h-14 w-full rounded-2xl border border-border/40 px-6 font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 sm:w-auto">
                                            <a href={course.courseUrl} target="_blank" rel="noreferrer">
                                                Open Platform
                                                <ExternalLink className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="rounded-[2rem] border-border/40 bg-card/40">
                <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Phase 1 boundary</h3>
                        <p className="text-muted-foreground">
                            NEXTARO curates and redirects. It does not host videos, track course completion, or manage enrollment.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link to="/courses">Browse all resources</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
