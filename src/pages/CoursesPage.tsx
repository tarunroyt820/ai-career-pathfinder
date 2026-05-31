import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, Filter, Search } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchCourseCategories, CourseCategory } from "@/services/courseCategoryApi";
import { fetchCourses, CourseDifficulty, CourseItem } from "@/services/courseApi";

const difficulties: Array<CourseDifficulty | ""> = ["", "Beginner", "Intermediate", "Advanced"];
const fallbackThumbnail = "/images/feature-curated-learning.jpg";

export default function CoursesPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<CourseDifficulty | "">("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourseCategories()
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    fetchCourses({
      search: search || undefined,
      category: selectedCategory || undefined,
      difficulty: selectedDifficulty || undefined,
      platform: selectedPlatform || undefined,
      limit: 24,
      sortBy: "featured",
    })
      .then((response) => setCourses(response.data.items))
      .catch(() => {
        setError("We couldn't load curated courses right now.");
        setCourses([]);
      })
      .finally(() => setIsLoading(false));
  }, [search, selectedCategory, selectedDifficulty, selectedPlatform]);

  const platforms = useMemo(
    () => [...new Set(courses.map((course) => course.platform))].sort((a, b) => a.localeCompare(b)),
    [courses]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="px-4 py-12 md:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <section className="grid gap-8 rounded-[2rem] border border-border/40 bg-card/60 p-8 shadow-xl shadow-black/5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Phase 1 Learning Hub
              </Badge>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Curated learning resources for career growth</h1>
              <p className="max-w-3xl text-lg text-muted-foreground">
                Explore trusted external courses, tutorials, and documentation without turning NEXTARO into an LMS. Find the right resource, understand why it matters, and jump directly into learning.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-muted/30 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Filter className="h-4 w-4" />
                Quick Filters
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, tag, or instructor"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(event) => setSelectedDifficulty(event.target.value as CourseDifficulty | "")}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty || "all"} value={difficulty}>
                      {difficulty || "All difficulty levels"}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPlatform}
                  onChange={(event) => setSelectedPlatform(event.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
                >
                  <option value="">All platforms</option>
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Course library</h2>
                <p className="text-sm text-muted-foreground">Browse trusted learning options by category, difficulty, and platform.</p>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {courses.length} resources
              </Badge>
            </div>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[360px] rounded-[1.75rem] border border-border/40 bg-card/40" />
                ))}
              </div>
            ) : error ? (
              <Card className="rounded-[1.75rem] border-destructive/20 bg-destructive/5">
                <CardContent className="p-8 text-sm text-destructive">{error}</CardContent>
              </Card>
            ) : courses.length === 0 ? (
              <Card className="rounded-[1.75rem] border-border/40 bg-card/40">
                <CardContent className="p-8 text-sm text-muted-foreground">
                  No resources matched your current filters. Try clearing one or two filters and search again.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course._id} className="overflow-hidden rounded-[1.75rem] border-border/40 bg-card/60 shadow-xl shadow-black/5">
                    <img
                      src={course.thumbnailUrl || fallbackThumbnail}
                      alt={course.title}
                      className="h-48 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = fallbackThumbnail;
                      }}
                    />
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{course.categoryName}</Badge>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{course.difficulty}</Badge>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black leading-tight">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-semibold text-foreground">Platform:</span> {course.platform}</p>
                        <p><span className="font-semibold text-foreground">Instructor:</span> {course.instructor}</p>
                        <p><span className="font-semibold text-foreground">Duration:</span> {course.durationLabel}</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button asChild className="flex-1 rounded-xl">
                          <Link to={`/courses/${course.slug}`}>View details</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                          <a href={course.courseUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
