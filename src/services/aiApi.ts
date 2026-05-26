import axios from "./http";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ai`;

export interface AIResponse {
    answer: string;
    success: boolean;
    providerUsed?: string;
    modelUsed?: string;
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

export const askAI = async (
    question: string,
    options?: { provider?: "groq" | "huggingface" | "hf"; imageUrls?: string[] }
): Promise<AIResponse> => {
    try {
        const response = await axios.post<AIResponse>(
            `${API_URL}/ask`,
            {
                question,
                provider: options?.provider,
                imageUrls: options?.imageUrls,
            },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw error;
    }
};

export const streamAI = async (
    question: string,
    onChunk: (text: string) => void,
    options?: { provider?: "groq" | "huggingface" | "hf"; imageUrls?: string[] }
): Promise<void> => {
    const token = localStorage.getItem("nextro_token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            message: question,
            provider: options?.provider,
            imageUrls: options?.imageUrls,
        }),
    });

    if (!response.ok || !response.body) {
        throw new Error("Streaming failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
            const line = event
                .split("\n")
                .find((entry) => entry.startsWith("data: "));

            if (!line) continue;

            const data = line.replace(/^data:\s*/, "");
            if (data === "[DONE]") {
                return;
            }

            const parsed = JSON.parse(data);
            if (parsed.error) {
                throw new Error(parsed.error);
            }

            if (parsed.text) {
                onChunk(parsed.text);
            }
        }
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

export const deleteHistory = async (): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    try {
        const response = await axios.delete<{ success: boolean; message: string; deletedCount: number }>(
            `${API_URL}/history`,
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting AI history:", error);
        throw error;
    }
};
