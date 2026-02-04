import axios from "axios";
import { UserProfile } from "@/types/profile";

const API_URL = "http://localhost:5000/api/profile";

export const getProfile = async (): Promise<UserProfile> => {
    try {
        const response = await axios.get<UserProfile>(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching profile from API:", error);
        throw error;
    }
};

export const updateProfile = async (profile: UserProfile): Promise<UserProfile> => {
    try {
        const response = await axios.put<{ message: string; profile: UserProfile }>(API_URL, profile);
        return response.data.profile;
    } catch (error) {
        console.error("Error updating profile via API:", error);
        throw error;
    }
};

export const getPublicProfile = async (id: string): Promise<UserProfile> => {
    try {
        const response = await axios.get<UserProfile>(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching public profile from API:", error);
        throw error;
    }
};
