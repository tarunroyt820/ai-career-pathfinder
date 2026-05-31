import http from "./http";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type CourseDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface CourseItem {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName: string;
  platform: string;
  courseUrl: string;
  thumbnailUrl?: string;
  instructor: string;
  durationLabel: string;
  difficulty: CourseDifficulty;
  language?: string;
  isFree: boolean;
  tags: string[];
  featured: boolean;
  viewCount: number;
  redirectCount: number;
  createdAt: string;
}

export interface PaginatedCoursesResponse {
  success: boolean;
  data: {
    items: CourseItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CourseDetailResponse {
  success: boolean;
  data: {
    course: CourseItem;
    relatedCourses: CourseItem[];
  };
}

export interface CourseQuery {
  search?: string;
  category?: string;
  platform?: string;
  difficulty?: CourseDifficulty | "";
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "newest" | "title" | "popular" | "featured";
}

export const fetchCourses = async (params: CourseQuery = {}) => {
  const response = await http.get<PaginatedCoursesResponse>(`${API_BASE_URL}/api/courses`, {
    params,
  });

  return response.data;
};

export const fetchFeaturedCourses = async () => {
  const response = await http.get<{ success: boolean; data: CourseItem[] }>(`${API_BASE_URL}/api/courses/featured`);
  return response.data;
};

export const fetchCourseBySlug = async (slug: string) => {
  const response = await http.get<CourseDetailResponse>(`${API_BASE_URL}/api/courses/${slug}`);
  return response.data;
};

export const trackCourseView = async (courseId: string) => {
  await http.post(`${API_BASE_URL}/api/courses/${courseId}/view`);
};

export const trackCourseRedirect = async (courseId: string) => {
  await http.post(`${API_BASE_URL}/api/courses/${courseId}/redirect`);
};
