import http from "./http";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface CourseCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export const fetchCourseCategories = async () => {
  const response = await http.get<{ success: boolean; data: CourseCategory[] }>(`${API_BASE_URL}/api/course-categories`);
  return response.data;
};
