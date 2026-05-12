import http from "./http";
import { getAuthHeader } from "@/utils/authToken";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/users`;

export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  createdAt?: string;
  lastActiveAt?: string;
  jobTitle?: string;
  careerGoal?: string;
}

export interface PaginatedUsersResponse {
  success: boolean;
  data: {
    items: AdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchAdminUsers = (q = "", page = 1, limit = 10) =>
  http.get<PaginatedUsersResponse>(`${BASE_URL}?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`, {
    headers: getAuthHeader(),
  });

export const suspendAdminUser = (id: string, reason: string) =>
  http.patch(`${BASE_URL}/${id}/suspend`, { reason }, { headers: getAuthHeader() });

export const unsuspendAdminUser = (id: string) =>
  http.patch(`${BASE_URL}/${id}/unsuspend`, {}, { headers: getAuthHeader() });

export const deleteAdminUser = (id: string) =>
  http.delete(`${BASE_URL}/${id}`, { headers: getAuthHeader() });
