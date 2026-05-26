import axios from "./http";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ai/skill-gap`;

export interface SkillGapResponse {
  success: boolean;
  role: string;
  analysis: string;
  existingSkills: string[];
  missingSkills: string[];
  learningPlan: string[];
  nextStep: string;
  savedToPlan: boolean;
}

export const generateSkillGapAnalysis = async (role: string): Promise<SkillGapResponse> => {
  const response = await axios.post<SkillGapResponse>(API_URL, { role });
  return response.data;
};
