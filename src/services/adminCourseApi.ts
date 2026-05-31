import http from "./http";
import { getAuthHeader } from "@/utils/authToken";
import type { CourseDifficulty } from "./courseApi";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin`;

export const COURSE_PLATFORMS = [
  "YouTube",
  "Coursera",
  "Udemy",
  "AWS Skill Builder",
  "Microsoft Learn",
  "Google Cloud Skills Boost",
  "freeCodeCamp",
  "GeeksforGeeks",
  "W3Schools",
  "MDN Docs",
] as const;

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];
export type CoursePlatform = (typeof COURSE_PLATFORMS)[number];

export interface AdminCourseItem {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName: string;
  platform: CoursePlatform | string;
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
  status: CourseStatus;
  sourceType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdminCoursesResponse {
  success: boolean;
  data: {
    items: AdminCourseItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCourseResponse {
  success: boolean;
  data: AdminCourseItem;
}

export interface AdminCoursePayload {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  platform: CoursePlatform | string;
  courseUrl: string;
  thumbnailUrl?: string;
  instructor: string;
  durationLabel: string;
  difficulty: CourseDifficulty;
  language?: string;
  isFree: boolean;
  tags: string[];
  status: CourseStatus;
  featured: boolean;
}

export interface AdminCourseQuery {
  search?: string;
  category?: string;
  platform?: string;
  difficulty?: CourseDifficulty | "";
  status?: CourseStatus | "";
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "newest" | "title" | "popular" | "featured";
}

export const fetchAdminCourses = async (params: AdminCourseQuery = {}) => {
  const response = await http.get<PaginatedAdminCoursesResponse>(`${BASE_URL}/courses`, {
    params,
    headers: getAuthHeader(),
  });

  return response.data;
};

export const fetchAdminCourseById = async (id: string) => {
  const response = await http.get<AdminCourseResponse>(`${BASE_URL}/courses/${id}`, {
    headers: getAuthHeader(),
  });

  return response.data;
};

export const createAdminCourse = async (payload: AdminCoursePayload) => {
  const response = await http.post<AdminCourseResponse>(`${BASE_URL}/courses`, payload, {
    headers: getAuthHeader(),
  });

  return response.data;
};

export const updateAdminCourse = async (id: string, payload: AdminCoursePayload) => {
  const response = await http.put<AdminCourseResponse>(`${BASE_URL}/courses/${id}`, payload, {
    headers: getAuthHeader(),
  });

  return response.data;
};
