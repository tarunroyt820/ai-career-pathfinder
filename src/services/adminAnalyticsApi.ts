import http from "./http";
import { getAuthHeader } from "@/utils/authToken";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/analytics`;

export interface SummaryTotals {
  totalUsers: number;
  totalCareerPlans: number;
  totalResumesUploaded: number;
  totalAIRequests: number;
  activeUsers: number;
}

export interface PopularRoleItem {
  role: string;
  count: number;
}

export interface MonthlyStatItem {
  month: string;
  count: number;
}

export interface ProviderUsageItem {
  provider: string;
  count: number;
}

export interface AdminSummaryResponse {
  success: boolean;
  data: {
    totals: SummaryTotals;
    charts: {
      popularRoles: PopularRoleItem[];
      userGrowth: MonthlyStatItem[];
      planCreationStats: MonthlyStatItem[];
    };
    aiUsage: {
      failedRequests: number;
      byProvider: ProviderUsageItem[];
    };
  };
}

export interface AIRequestLogItem {
  _id: string;
  endpoint: string;
  provider: string;
  model: string;
  intent: string;
  promptLength: number;
  responseLength: number;
  status: "success" | "failed";
  httpStatus: number;
  errorCode?: string;
  errorMessage?: string;
  latencyMs: number;
  createdAt: string;
  userId?: {
    fullName?: string;
    email?: string;
  };
}

export interface AIRequestLogResponse {
  success: boolean;
  data: {
    items: AIRequestLogItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchAdminSummary = () =>
  http.get<AdminSummaryResponse>(`${BASE_URL}/summary`, { headers: getAuthHeader() });

export const fetchAiLogs = (q = "", page = 1, limit = 20) =>
  http.get<AIRequestLogResponse>(`${BASE_URL}/ai-logs?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`, {
    headers: getAuthHeader(),
  });

export const fetchFailedAiRequests = () =>
  http.get<{ success: boolean; data: AIRequestLogItem[] }>(`${BASE_URL}/failed-ai-requests`, {
    headers: getAuthHeader(),
  });
