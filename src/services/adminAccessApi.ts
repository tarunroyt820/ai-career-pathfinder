import http from "./http";
import { getAuthHeader } from "@/utils/authToken";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/analytics`;

export const fetchAdminAccess = () =>
  http.get<{ success: boolean; isAdmin: boolean }>(`${BASE_URL}/access`, {
    headers: getAuthHeader(),
  });
