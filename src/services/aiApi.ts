import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ai`;

export interface AIResponse {
    answer: string;
    success: boolean;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

const getAuthHeader = () => {
    const token = localStorage.getItem("nextro_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const askAI = async (question: string): Promise<AIResponse> => {
    try {
        const response = await axios.post<AIResponse>(
            `${API_URL}/ask`,
            { question },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw error;
    }
};

export const getHistory = async (): Promise<ChatMessage[]> => {
    try {
        const response = await axios.get<{ success: boolean; messages: ChatMessage[] }>(
            `${API_URL}/history`,
            { headers: getAuthHeader() }
        );
        return response.data.messages;
    } catch (error) {
        console.error("Error fetching AI history:", error);
        throw error;
    }
};
