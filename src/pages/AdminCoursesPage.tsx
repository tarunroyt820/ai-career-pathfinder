import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink, Filter, Plus, Search } from "lucide-react";

import { Button } from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchCourseCategories, type CourseCategory } from "@/services/courseCategoryApi";
import {
  COURSE_PLATFORMS,
  fetchAdminCourses,
  type AdminCourseItem,
  type CourseStatus,
  updateAdminCourse,
} from "@/services/adminCourseApi";

const fallbackThumbnail = "/images/feature-curated-learning.jpg";

const statusLabels: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const statusStyles: Record<CourseStatus, string> = {
  draft: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  published: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  archived: "border-slate-400/30 bg-slate-500/10 text-slate-200",
};

const difficultyOptions = ["", "Beginner", "Intermediate", "Advanced"] as const;

const buildAdminPayload = (
  course: AdminCourseItem,
  overrides: { status?: CourseStatus; featured?: boolean } = {},
) => ({
  title: course.title,
  slug: course.slug,
  shortDescription: course.shortDescription,
  fullDescription: course.fullDescription,
  categoryId: course.categoryId,
  platform: course.platform,
  courseUrl: course.courseUrl,
  thumbnailUrl: course.thumbnailUrl || "",
  instructor: course.instructor,
  durationLabel: course.durationLabel,
  difficulty: course.difficulty,
  language: course.language || "English",
  isFree: course.isFree,
  tags: course.tags,
  status: overrides.status || course.status,
  featured: overrides.featured ?? course.featured,
});

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"" | AdminCourseItem["difficulty"]>("");
  const [selectedStatus, setSelectedStatus] = useState<"" | CourseStatus>("");
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [courseResponse, categoryResponse] = await Promise.all([
        fetchAdminCourses({
          search: search || undefined,
          category: selectedCategory || undefined,
          platform: selectedPlatform || undefined,
          difficulty: selectedDifficulty || undefined,
          status: selectedStatus || undefined,
          featured: isFeaturedOnly ? true : undefined,
          limit: 100,
          sortBy: "newest",
        }),
        fetchCourseCategories(),
      ]);

      setCourses(courseResponse.data.items || []);
      setCategories(categoryResponse.data || []);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || "Failed to load course management data.");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedPlatform, selectedDifficulty, selectedStatus, isFeaturedOnly]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const stats = useMemo(() => {
    const published = courses.filter((course) => course.status === "published").length;
    const drafts = courses.filter((course) => course.status === "draft").length;
    const archived = courses.filter((course) => course.status === "archived").length;
    const featured = courses.filter((course) => course.featured).length;

    return { published, drafts, archived, featured };
  }, [courses]);

  const handleToggleStatus = async (course: AdminCourseItem, nextStatus: CourseStatus) => {
    try {
      setActionId(course._id);
      await updateAdminCourse(course._id, buildAdminPayload(course, { status: nextStatus }));
      await loadCourses();
    } catch (toggleError: any) {
      setError(toggleError?.response?.data?.message || "Failed to update course status.");
    } finally {
      setActionId("");
    }
  };

  const handleToggleFeatured = async (course: AdminCourseItem) => {
    try {
      setActionId(course._id);
      await updateAdminCourse(course._id, buildAdminPayload(course, { featured: !course.featured }));
      await loadCourses();
    } catch (toggleError: any) {
      setError(toggleError?.response?.data?.message || "Failed to update featured state.");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0 text-slate-400 hover:text-white">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to admin dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-black text-white">Course Management</h1>
          <p className="max-w-3xl text-sm text-[rgba(189,216,233,0.75)]">
            Create, edit, publish, archive, and feature curated learning resources without turning NEXTARO into an LMS.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-[#16A085] text-white hover:bg-[#129076]">
          <Link to="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New course
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-900/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-4">
          <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Total resources</p>
          <p className="mt-2 text-2xl font-bold text-white">{courses.length}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-4">
          <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Published</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-4">
          <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Drafts</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.drafts}</p>
        </div>
        <div className="rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-4">
          <p className="text-xs uppercase tracking-wide text-[rgba(189,216,233,0.7)]">Featured</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.featured}</p>
        </div>
      </div>

      <Card className="border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] shadow-none">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[rgba(189,216,233,0.75)]">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, tag, or instructor"
                className="border-white/10 bg-[#0b1730] pl-10 text-white placeholder:text-slate-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-10 rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value)}
              className="h-10 rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
            >
              <option value="">All platforms</option>
              {COURSE_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(event) => setSelectedDifficulty(event.target.value as "" | AdminCourseItem["difficulty"])}
              className="h-10 rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
            >
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty || "all"} value={difficulty}>
                  {difficulty || "All difficulties"}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as "" | CourseStatus)}
              className="h-10 rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={isFeaturedOnly}
              onChange={(event) => setIsFeaturedOnly(event.target.checked)}
            />
            Featured only
          </label>
          <div>
            <Button type="button" variant="outline" onClick={() => void loadCourses()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Apply filters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] p-6 text-sm text-slate-300">
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <Card className="border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] shadow-none">
          <CardContent className="space-y-4 p-6 text-sm text-slate-300">
            <p>No courses matched the current filters.</p>
            <Button asChild className="rounded-xl bg-[#16A085] text-white hover:bg-[#129076]">
              <Link to="/admin/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create first course
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] shadow-none">
          <CardContent className="overflow-x-auto p-0">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-b border-white/5 align-top last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <img
                          src={course.thumbnailUrl || fallbackThumbnail}
                          alt={course.title}
                          className="h-16 w-24 rounded-xl object-cover"
                          onError={(event) => {
                            event.currentTarget.src = fallbackThumbnail;
                          }}
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2">
                            <Badge className={statusStyles[course.status]}>{statusLabels[course.status]}</Badge>
                            {course.featured && <Badge className="border-primary/30 bg-primary/10 text-primary">Featured</Badge>}
                          </div>
                          <p className="font-semibold text-white">{course.title}</p>
                          <p className="max-w-xl text-xs text-slate-400">{course.shortDescription}</p>
                          <p className="text-xs text-slate-500">{course.platform} • {course.difficulty} • {course.durationLabel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{course.categoryName}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                          {course.status}
                        </Badge>
                        <div className="text-xs text-slate-400">Slug: {course.slug}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div>{course.viewCount}</div>
                      <div className="text-xs text-slate-500">Redirects: {course.redirectCount}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-lg border-white/10 text-slate-100">
                          <Link to={`/admin/courses/${course._id}/edit`}>Edit</Link>
                        </Button>
                        {course.status === "published" ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-lg border-white/10 text-slate-100"
                            onClick={() => void handleToggleStatus(course, "archived")}
                            disabled={actionId === course._id}
                          >
                            Archive
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-lg border-white/10 text-slate-100"
                            onClick={() => void handleToggleStatus(course, "published")}
                            disabled={actionId === course._id}
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-lg border-white/10 text-slate-100"
                          onClick={() => void handleToggleFeatured(course)}
                          disabled={actionId === course._id}
                        >
                          {course.featured ? "Unfeature" : "Feature"}
                        </Button>
                        {course.status === "published" && (
                          <Button asChild variant="ghost" className="rounded-lg text-slate-300 hover:text-white">
                            <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View public
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
