import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCourseCategories, type CourseCategory } from "@/services/courseCategoryApi";
import {
  COURSE_PLATFORMS,
  COURSE_STATUSES,
  createAdminCourse,
  fetchAdminCourseById,
  type AdminCourseItem,
  type AdminCoursePayload,
  type CourseStatus,
  updateAdminCourse,
} from "@/services/adminCourseApi";

type FormValues = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  platform: string;
  courseUrl: string;
  thumbnailUrl: string;
  instructor: string;
  durationLabel: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  language: string;
  isFree: boolean;
  tags: string;
  status: CourseStatus;
  featured: boolean;
};

const defaultValues: FormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  categoryId: "",
  platform: COURSE_PLATFORMS[0],
  courseUrl: "",
  thumbnailUrl: "",
  instructor: "",
  durationLabel: "",
  difficulty: "Beginner",
  language: "English",
  isFree: true,
  tags: "",
  status: "draft",
  featured: false,
};

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const toFormValues = (course: AdminCourseItem): FormValues => ({
  title: course.title || "",
  slug: course.slug || "",
  shortDescription: course.shortDescription || "",
  fullDescription: course.fullDescription || "",
  categoryId: course.categoryId || "",
  platform: course.platform || COURSE_PLATFORMS[0],
  courseUrl: course.courseUrl || "",
  thumbnailUrl: course.thumbnailUrl || "",
  instructor: course.instructor || "",
  durationLabel: course.durationLabel || "",
  difficulty: course.difficulty || "Beginner",
  language: course.language || "English",
  isFree: course.isFree !== false,
  tags: course.tags?.join(", ") || "",
  status: course.status || "draft",
  featured: Boolean(course.featured),
});

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toPayload = (values: FormValues): AdminCoursePayload => ({
  title: values.title.trim(),
  slug: slugify(values.slug || values.title),
  shortDescription: values.shortDescription.trim(),
  fullDescription: values.fullDescription.trim(),
  categoryId: values.categoryId,
  platform: values.platform,
  courseUrl: values.courseUrl.trim(),
  thumbnailUrl: values.thumbnailUrl.trim(),
  instructor: values.instructor.trim(),
  durationLabel: values.durationLabel.trim(),
  difficulty: values.difficulty,
  language: values.language.trim() || "English",
  isFree: values.isFree,
  tags: values.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  status: values.status,
  featured: values.featured,
});

export default function AdminCourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [values, setValues] = useState<FormValues>(defaultValues);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [categoryResponse, courseResponse] = await Promise.all([
          fetchCourseCategories(),
          isEditing && id ? fetchAdminCourseById(id) : Promise.resolve(null),
        ]);

        if (!active) return;

        setCategories(categoryResponse.data || []);

        if (courseResponse?.data) {
          setValues(toFormValues(courseResponse.data));
          setSlugLocked(true);
        }
      } catch (loadError: any) {
        if (active) {
          setError(loadError?.response?.data?.message || "Failed to load course form.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [id, isEditing]);

  const validationError = useMemo(() => {
    if (!values.title.trim()) return "Course title is required.";
    if (!values.shortDescription.trim()) return "Short description is required.";
    if (!values.fullDescription.trim()) return "Full description is required.";
    if (!values.categoryId) return "Please choose a category.";
    if (!values.instructor.trim()) return "Instructor is required.";
    if (!values.durationLabel.trim()) return "Duration is required.";
    if (!values.courseUrl.trim() || !isValidHttpUrl(values.courseUrl.trim())) return "Enter a valid course URL.";
    if (values.thumbnailUrl.trim() && !isValidHttpUrl(values.thumbnailUrl.trim())) return "Thumbnail URL must be valid.";
    return "";
  }, [values]);

  const handleChange = <K extends keyof FormValues>(field: K, nextValue: FormValues[K]) => {
    setValues((currentValues) => {
      const nextValues = { ...currentValues, [field]: nextValue };

      if (!slugLocked && field === "title") {
        nextValues.slug = slugify(String(nextValue));
      }

      return nextValues;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const payload = toPayload(values);

      if (isEditing && id) {
        await updateAdminCourse(id, payload);
      } else {
        await createAdminCourse(payload);
      }

      navigate("/admin/courses");
    } catch (saveError: any) {
      setError(saveError?.response?.data?.message || "Failed to save course.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 lg:px-10">
      <Button asChild variant="ghost" className="px-0 text-slate-400 hover:text-white">
        <Link to="/admin/courses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to course management
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-black text-white">{isEditing ? "Edit course" : "Create course"}</h1>
        <p className="text-sm text-[rgba(189,216,233,0.75)]">
          Add curated resources, control visibility, and keep phase 1 focused on external learning links.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-900/20 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] shadow-none">
          <CardContent className="flex items-center gap-3 p-6 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading course form...
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] shadow-none">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title" className="text-slate-200">Title</Label>
                  <Input
                    id="title"
                    value={values.title}
                    onChange={(event) => handleChange("title", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="Full Stack Web Development"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slug" className="text-slate-200">Slug</Label>
                  <Input
                    id="slug"
                    value={values.slug}
                    onChange={(event) => {
                      setSlugLocked(true);
                      handleChange("slug", event.target.value);
                    }}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="full-stack-web-development"
                  />
                  <p className="text-xs text-slate-400">
                    Used in the public URL. Leave it to auto-generate from the title, or override it manually.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="shortDescription" className="text-slate-200">Short description</Label>
                  <Textarea
                    id="shortDescription"
                    value={values.shortDescription}
                    onChange={(event) => handleChange("shortDescription", event.target.value)}
                    className="min-h-24 border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="A concise summary of the resource."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fullDescription" className="text-slate-200">Full description</Label>
                  <Textarea
                    id="fullDescription"
                    value={values.fullDescription}
                    onChange={(event) => handleChange("fullDescription", event.target.value)}
                    className="min-h-40 border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="Explain what the resource covers and why it is useful."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-slate-200">Category</Label>
                  <select
                    id="categoryId"
                    value={values.categoryId}
                    onChange={(event) => handleChange("categoryId", event.target.value)}
                    className="h-10 w-full rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-slate-200">Platform</Label>
                  <select
                    id="platform"
                    value={values.platform}
                    onChange={(event) => handleChange("platform", event.target.value)}
                    className="h-10 w-full rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
                  >
                    {COURSE_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-slate-200">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={values.difficulty}
                    onChange={(event) => handleChange("difficulty", event.target.value as FormValues["difficulty"])}
                    className="h-10 w-full rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-200">Status</Label>
                  <select
                    id="status"
                    value={values.status}
                    onChange={(event) => handleChange("status", event.target.value as CourseStatus)}
                    className="h-10 w-full rounded-md border border-white/10 bg-[#0b1730] px-3 text-sm text-white outline-none"
                  >
                    {COURSE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructor" className="text-slate-200">Instructor</Label>
                  <Input
                    id="instructor"
                    value={values.instructor}
                    onChange={(event) => handleChange("instructor", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="freeCodeCamp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationLabel" className="text-slate-200">Duration label</Label>
                  <Input
                    id="durationLabel"
                    value={values.durationLabel}
                    onChange={(event) => handleChange("durationLabel", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="8 Hours"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseUrl" className="text-slate-200">Course URL</Label>
                  <Input
                    id="courseUrl"
                    value={values.courseUrl}
                    onChange={(event) => handleChange("courseUrl", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl" className="text-slate-200">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    value={values.thumbnailUrl}
                    onChange={(event) => handleChange("thumbnailUrl", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-slate-200">Language</Label>
                  <Input
                    id="language"
                    value={values.language}
                    onChange={(event) => handleChange("language", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="English"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags" className="text-slate-200">Tags</Label>
                  <Input
                    id="tags"
                    value={values.tags}
                    onChange={(event) => handleChange("tags", event.target.value)}
                    className="border-white/10 bg-[#0b1730] text-white placeholder:text-slate-400"
                    placeholder="react, nodejs, mongodb"
                  />
                </div>

                <div className="flex flex-wrap gap-6 md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={values.isFree}
                      onChange={(event) => handleChange("isFree", event.target.checked)}
                    />
                    Free resource
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={values.featured}
                      onChange={(event) => handleChange("featured", event.target.checked)}
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  className="rounded-xl bg-[#16A085] text-white hover:bg-[#129076]"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : isEditing ? "Update course" : "Create course"}
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-white/10 text-slate-100">
                  <a href={values.courseUrl || "#"} target="_blank" rel="noreferrer">
                    Preview external link
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[rgba(22,160,133,0.25)] bg-[rgba(20,37,62,0.55)] shadow-none">
            <CardContent className="space-y-3 p-4 md:p-6">
              <h2 className="text-lg font-bold text-white">Current preview</h2>
              <div className="rounded-2xl border border-white/10 bg-[#0b1730] p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-primary/30 bg-primary/10 text-primary">{values.status}</Badge>
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                    {values.platform}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                    {values.difficulty}
                  </Badge>
                </div>
                <h3 className="mt-4 text-2xl font-black text-white">{values.title || "Untitled course"}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {values.shortDescription || "Add a short description to preview how the public page will read."}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  {values.courseUrl ? values.courseUrl : "No external URL yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
