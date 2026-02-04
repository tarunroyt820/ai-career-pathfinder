import { UserProfile } from "@/types/profile";

const STORAGE_KEY = "nextro_user_profile";

export const initialProfile: UserProfile = {
    fullName: "",
    email: "",
    education: {
        college: "",
        degree: "",
        graduationYear: "",
    },
    skills: [],
    careerGoal: "",
    jobTitle: "",
    experienceLevel: "beginner",
};

export const loadProfile = (): UserProfile => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return initialProfile;

        // Merge with initialProfile to ensure all fields exist
        const parsed = JSON.parse(data);
        return { ...initialProfile, ...parsed };
    } catch (error) {
        console.error("Error loading profile from localStorage:", error);
        return initialProfile;
    }
};

export const saveProfile = (profile: UserProfile): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.error("Error saving profile to localStorage:", error);
    }
};
