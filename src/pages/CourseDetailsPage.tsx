import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Globe, GraduationCap, Timer } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CourseItem, fetchCourseBySlug, trackCourseRedirect, trackCourseView } from "@/services/courseApi";

const fallbackThumbnail = "/images/feature-curated-learning.jpg";

export default function CourseDetailsPage() {
  const { slug = "" } = useParams();
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [relatedCourses, setRelatedCourses] = useState<CourseItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError("");

    fetchCourseBySlug(slug)
      .then((response) => {
        setCourse(response.data.course);
        setRelatedCourses(response.data.relatedCourses);
        void trackCourseView(response.data.course._id).catch(() => {});
      })
      .catch(() => {
        setError("We couldn't load this course resource.");
        setCourse(null);
        setRelatedCourses([]);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleExternalClick = async () => {
    if (!course) return;
    try {
      await trackCourseRedirect(course._id);
    } catch (_error) {
      // Ignore analytics failures so navigation is never blocked.
    }
    window.open(course.courseUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="px-4 py-12 md:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <Button asChild variant="ghost" className="rounded-xl px-0 text-muted-foreground hover:text-foreground">
            <Link to="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to course library
            </Link>
          </Button>

          {isLoading ? (
            <div className="h-[520px] rounded-[2rem] border border-border/40 bg-card/40" />
          ) : error || !course ? (
            <Card className="rounded-[2rem] border-destructive/20 bg-destructive/5">
              <CardContent className="p-8 text-sm text-destructive">{error || "Course not found."}</CardContent>
            </Card>
          ) : (
            <>
              <section className="grid gap-8 rounded-[2rem] border border-border/40 bg-card/60 p-6 shadow-xl shadow-black/5 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{course.categoryName}</Badge>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{course.difficulty}</Badge>
                    <Badge variant="outline">{course.platform}</Badge>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl font-black tracking-tight">{course.title}</h1>
                    <p className="text-lg text-muted-foreground">{course.shortDescription}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        Instructor
                      </div>
                      <p className="mt-2 font-semibold">{course.instructor}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        Duration
                      </div>
                      <p className="mt-2 font-semibold">{course.durationLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        Platform
                      </div>
                      <p className="mt-2 font-semibold">{course.platform}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-xl font-black">About this resource</h2>
                    <p className="leading-7 text-muted-foreground">{course.fullDescription}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={handleExternalClick} className="rounded-xl px-6">
                      Open on {course.platform}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl px-6">
                      <Link to="/courses">Explore more resources</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This resource opens on an external learning platform. NEXTARO curates the recommendation but does not host the course content.
                  </p>
                </div>
                <div className="overflow-hidden rounded-[1.75rem] border border-border/40">
                  <img
                    src={course.thumbnailUrl || fallbackThumbnail}
                    alt={course.title}
                    className="h-full min-h-[320px] w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = fallbackThumbnail;
                    }}
                  />
                </div>
              </section>

              <section className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">More in {course.categoryName}</h2>
                  <p className="text-sm text-muted-foreground">Keep exploring nearby resources in the same learning direction.</p>
                </div>
                {relatedCourses.length === 0 ? (
                  <Card className="rounded-[1.5rem] border-border/40 bg-card/40">
                    <CardContent className="p-6 text-sm text-muted-foreground">More resources in this category will appear here as the library grows.</CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {relatedCourses.map((item) => (
                      <Card key={item._id} className="overflow-hidden rounded-[1.5rem] border-border/40 bg-card/60">
                        <img
                          src={item.thumbnailUrl || fallbackThumbnail}
                          alt={item.title}
                          className="h-40 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = fallbackThumbnail;
                          }}
                        />
                        <CardContent className="space-y-3 p-4">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.difficulty}</Badge>
                          <h3 className="font-black leading-tight">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">{item.platform}</p>
                          <Button asChild variant="outline" className="w-full rounded-xl">
                            <Link to={`/courses/${item.slug}`}>View resource</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
