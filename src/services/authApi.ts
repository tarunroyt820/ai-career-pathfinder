import axios from "./http";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth`;

export interface AuthResponse {
    token?: string;
    refreshToken?: string;
    user?: {
        id: string;
        fullName: string;
        email: string;
        isEmailVerified?: boolean;
    };
    message: string;
}


export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/login`, { email, password });

    if (!response.data || !response.data.token) {
        throw new Error("Invalid server response: No token received");
    }

    localStorage.setItem(
        "nextro_token",
        response.data.token
    );
    if (response.data.refreshToken) {
        localStorage.setItem(
            "nextro_refresh_token",
            response.data.refreshToken
        );
    }
    return response.data;
};

export const signup = async (
    fullName: string,
    email: string,
    password: string,
    joinSkillExchange = false
): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(`${API_URL}/signup`, {
        fullName,
        email,
        password,
        joinSkillExchange
    });
    return response.data;
};

export const verifyEmail = async (email: string, otp: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(`${API_URL}/verify-email`, {
        email,
        otp
    });
    return response.data;
};

export const resendVerification = async (email: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(`${API_URL}/resend-verification`, { email });
    return response.data;
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(`${API_URL}/forgot-password`, { email });
    return response.data;
};

export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(`${API_URL}/reset-password`, { token, password });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("nextro_token");
    localStorage.removeItem("nextro_refresh_token");
};

export const getToken = () => {
    return localStorage.getItem("nextro_token");
};
