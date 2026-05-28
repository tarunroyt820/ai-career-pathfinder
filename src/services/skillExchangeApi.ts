import axios from "./http";
import { getAuthHeader } from "@/utils/authToken";

const BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface SkillItem {
  name: string;
  category: string;
  proficiencyLevel: ProficiencyLevel;
}

export interface SkillProfile {
  _id?: string;
  userId: string | { _id: string; fullName?: string };
  skillsOffered: SkillItem[];
  skillsWanted: SkillItem[];
  bio: string;
  hourlyRate: number;
  isActive: boolean;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  _id?: string;
  userId: string;
  weeklySlots: AvailabilitySlot[];
  blockedDates: string[];
  timezone: string;
}

export interface MatchCard {
  _id: string;
  userId: { _id: string; fullName?: string };
  skillsOffered: SkillItem[];
  skillsWanted: SkillItem[];
  bio: string;
  matchScore: number;
  matchReasons: string[];
}

export interface TradeRequest {
  _id: string;
  from: { _id: string; fullName?: string } | string;
  to: { _id: string; fullName?: string } | string;
  offeredSkill: string;
  requestedSkill: string;
  proposedCredits: number;
  proposedDuration: number;
  status: "pending" | "accepted" | "declined" | "countered" | "expired";
  counterOffer?: { credits?: number; duration?: number; message?: string };
  createdAt: string;
}

export interface GlobalLearningRequest {
  _id: string;
  createdBy: { _id: string; fullName?: string } | string;
  acceptedBy?: { _id: string; fullName?: string } | string | null;
  acceptedTradeRequestId?: {
    _id?: string;
    status?: string;
    proposedCredits?: number;
    proposedDuration?: number;
  } | null;
  skillWanted: string;
  goalTitle: string;
  description: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredDuration: number;
  budgetCredits: number;
  visibility: "matched_only";
  status: "open" | "accepted" | "cancelled" | "expired" | "closed";
  expiresAt?: string;
  closedAt?: string | null;
  createdAt: string;
}

export interface TradeRequestMessage {
  _id: string;
  tradeRequestId: string;
  senderId?: { _id?: string; fullName?: string; profilePhotoUrl?: string } | null;
  message: string;
  systemMessage?: boolean;
  createdAt?: string;
}

export interface Agreement {
  _id: string;
  participants: Array<{ _id: string; fullName?: string } | string>;
  skill: string;
  duration: number;
  credits: number;
  status: "active" | "completed" | "disputed" | "cancelled";
  completedAt?: string | null;
}

export interface Session {
  _id: string;
  agreementId: string;
  scheduledAt: string;
  completedAt?: string | null;
  participantConfirmations?: Array<{
    userId: string | { _id: string; fullName?: string };
    confirmedAt?: string;
  }>;
  noShowReported?: {
    by?: string | { _id: string; fullName?: string };
    at?: string;
    reason?: string;
    proof?: string;
  } | null;
  status: "scheduled" | "completed" | "disputed" | "noshow";
}

export interface Review {
  _id: string;
  agreementId: string;
  reviewerId: { _id: string; fullName?: string } | string;
  revieweeId: { _id: string; fullName?: string } | string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  relatedId: unknown;
  read: boolean;
  createdAt: string;
}

const parseApiError = (error: unknown): string => {
  const maybe = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return maybe.response?.data?.error || maybe.response?.data?.message || maybe.message || "Request failed";
};

export const upsertSkillProfile = async (payload: {
  skillsOffered: SkillItem[];
  skillsWanted: SkillItem[];
  bio: string;
  hourlyRate: number;
  isActive: boolean;
}): Promise<SkillProfile> => {
  try {
    const response = await axios.post<{ profile: SkillProfile }>(`${BASE_URL}/skills`, payload, {
      headers: getAuthHeader(),
    });
    return response.data.profile;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getSkillProfile = async (userId: string): Promise<SkillProfile> => {
  try {
    const response = await axios.get<{ profile: SkillProfile }>(`${BASE_URL}/skills/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data.profile;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const saveAvailability = async (payload: {
  weeklySlots: AvailabilitySlot[];
  blockedDates?: string[];
  timezone?: string;
}): Promise<AvailabilityResponse> => {
  try {
    const response = await axios.post<{ availability: AvailabilityResponse }>(`${BASE_URL}/availability`, payload, {
      headers: getAuthHeader(),
    });
    return response.data.availability;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getAvailability = async (userId: string): Promise<AvailabilityResponse> => {
  try {
    const response = await axios.get<{ availability: AvailabilityResponse }>(`${BASE_URL}/availability/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data.availability;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getMatches = async (skill: string, page = 1, limit = 12): Promise<{ matches: MatchCard[]; total: number; page: number }> => {
  try {
    const params = new URLSearchParams();
    if (skill.trim()) params.set("skill", skill.trim());
    params.set("page", String(page));
    params.set("limit", String(limit));
    const response = await axios.get<{ matches: MatchCard[]; total: number; page: number }>(
      `${BASE_URL}/matches?${params.toString()}`,
      { headers: getAuthHeader() },
    );
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const searchProfiles = async (q: string, type: 'all' | 'skill' | 'name' | 'user' = 'all', page = 1, limit = 20): Promise<{ profiles: SkillProfile[]; total: number; page: number }> => {
  try {
    const params = new URLSearchParams();
    params.set('q', q);
    params.set('type', type);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const response = await axios.get<{ profiles: SkillProfile[]; total: number; page: number }>(
      `${BASE_URL}/skills/search?${params.toString()}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const createTradeRequest = async (payload: {
  to: string;
  offeredSkill: string;
  requestedSkill: string;
  proposedCredits: number;
  proposedDuration: number;
  message?: string;
}): Promise<TradeRequest> => {
  try {
    const response = await axios.post<{ request: TradeRequest }>(`${BASE_URL}/requests`, payload, {
      headers: getAuthHeader(),
    });
    return response.data.request;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const createGlobalLearningRequest = async (payload: {
  skillWanted: string;
  goalTitle: string;
  description?: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredDuration: number;
  budgetCredits?: number;
}): Promise<{ request: GlobalLearningRequest; recipientsNotified: number }> => {
  try {
    const response = await axios.post<{ request: GlobalLearningRequest; recipientsNotified: number }>(
      `${BASE_URL}/global-learning-requests`,
      payload,
      { headers: getAuthHeader() },
    );
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getGlobalLearningRequests = async (): Promise<GlobalLearningRequest[]> => {
  try {
    const response = await axios.get<{ requests: GlobalLearningRequest[] }>(`${BASE_URL}/global-learning-requests`, {
      headers: getAuthHeader(),
    });
    return response.data.requests || [];
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getMyGlobalLearningRequests = async (): Promise<GlobalLearningRequest[]> => {
  try {
    const response = await axios.get<{ requests: GlobalLearningRequest[] }>(`${BASE_URL}/global-learning-requests/mine`, {
      headers: getAuthHeader(),
    });
    return response.data.requests || [];
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const acceptGlobalLearningRequest = async (requestId: string): Promise<{ request: GlobalLearningRequest; tradeRequest?: TradeRequest }> => {
  try {
    const response = await axios.patch<{ request: GlobalLearningRequest; tradeRequest?: TradeRequest }>(
      `${BASE_URL}/global-learning-requests/${requestId}/accept`,
      {},
      { headers: getAuthHeader() },
    );
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const cancelGlobalLearningRequest = async (requestId: string): Promise<GlobalLearningRequest> => {
  try {
    const response = await axios.patch<{ request: GlobalLearningRequest }>(
      `${BASE_URL}/global-learning-requests/${requestId}/cancel`,
      {},
      { headers: getAuthHeader() },
    );
    return response.data.request;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getTradeRequests = async (type: "sent" | "received"): Promise<TradeRequest[]> => {
  try {
    const response = await axios.get<{ requests: TradeRequest[] }>(`${BASE_URL}/requests?type=${type}`, {
      headers: getAuthHeader(),
    });
    return response.data.requests;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const acceptTradeRequest = async (requestId: string): Promise<void> => {
  try {
    await axios.patch(`${BASE_URL}/requests/${requestId}/accept`, {}, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const declineTradeRequest = async (requestId: string): Promise<void> => {
  try {
    await axios.patch(`${BASE_URL}/requests/${requestId}/decline`, {}, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const counterTradeRequest = async (requestId: string, payload: { credits?: number; duration?: number; message?: string }): Promise<void> => {
  try {
    await axios.patch(`${BASE_URL}/requests/${requestId}/counter`, payload, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getTradeRequestMessages = async (requestId: string): Promise<TradeRequestMessage[]> => {
  try {
    const response = await axios.get<{ messages: TradeRequestMessage[] }>(`${BASE_URL}/requests/${requestId}/messages`, {
      headers: getAuthHeader(),
    });
    return response.data.messages || [];
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const sendTradeRequestMessage = async (requestId: string, message: string): Promise<TradeRequestMessage> => {
  try {
    const response = await axios.post<{ message: TradeRequestMessage }>(
      `${BASE_URL}/requests/${requestId}/messages`,
      { message },
      { headers: getAuthHeader() },
    );
    return response.data.message;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getAgreements = async (status?: string): Promise<Agreement[]> => {
  try {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await axios.get<{ agreements: Agreement[] }>(`${BASE_URL}/agreements${suffix}`, {
      headers: getAuthHeader(),
    });
    return response.data.agreements;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const createSession = async (agreementId: string, scheduledAt: string): Promise<Session> => {
  try {
    const response = await axios.post<{ session: Session }>(
      `${BASE_URL}/sessions`,
      { agreementId, scheduledAt },
      { headers: getAuthHeader() },
    );
    return response.data.session;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getSessions = async (agreementId?: string): Promise<Session[]> => {
  try {
    const suffix = agreementId ? `?agreementId=${encodeURIComponent(agreementId)}` : "";
    const response = await axios.get<{ sessions: Session[] }>(`${BASE_URL}/sessions${suffix}`, {
      headers: getAuthHeader(),
    });
    return response.data.sessions;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const confirmSession = async (sessionId: string): Promise<Session> => {
  try {
    const response = await axios.patch<{ session: Session }>(`${BASE_URL}/sessions/${sessionId}/confirm`, {}, { headers: getAuthHeader() });
    return response.data.session;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const reportNoShow = async (sessionId: string, reason: string, proof: string): Promise<Session> => {
  try {
    const response = await axios.patch<{ session: Session }>(
      `${BASE_URL}/sessions/${sessionId}/report-noshow`,
      { reason, proof },
      { headers: getAuthHeader() },
    );
    return response.data.session;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const fileDispute = async (payload: {
  agreementId: string;
  reason: "noshow" | "quality" | "other";
  description: string;
  evidence: string[];
}): Promise<void> => {
  try {
    await axios.post(`${BASE_URL}/disputes`, payload, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const submitReview = async (payload: {
  agreementId: string;
  revieweeId: string;
  rating: number;
  comment: string;
}): Promise<void> => {
  try {
    await axios.post(`${BASE_URL}/reviews`, payload, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getReviews = async (userId: string): Promise<Review[]> => {
  try {
    const response = await axios.get<{ reviews: Review[] }>(`${BASE_URL}/reviews/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data.reviews;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getNotifications = async (): Promise<NotificationItem[]> => {
  try {
    const response = await axios.get<{
      notifications?: NotificationItem[];
      data?: { notifications?: NotificationItem[] };
    }>(`${BASE_URL}/notifications`, {
      headers: getAuthHeader(),
    });
    return response.data.notifications || response.data.data?.notifications || [];
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  try {
    await axios.patch(`${BASE_URL}/notifications/${notificationId}/read`, {}, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    await axios.patch(`${BASE_URL}/notifications/read-all`, {}, { headers: getAuthHeader() });
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};
