import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth`;

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        fullName: string;
        email: string;
    };
    message: string;
}


export const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await axios.post<AuthResponse>(`${API_URL}/login`, { email, password });

        if (!response.data || !response.data.token) {
            throw new Error("Invalid server response: No token received");
        }

        localStorage.setItem("nextro_token", response.data.token);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const signup = async (fullName: string, email: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await axios.post<AuthResponse>(`${API_URL}/signup`, { fullName, email, password });

        if (!response.data || !response.data.token) {
            throw new Error("Invalid server response: No token received");
        }

        localStorage.setItem("nextro_token", response.data.token);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem("nextro_token");
};

export const getToken = () => {
    return localStorage.getItem("nextro_token");
};
