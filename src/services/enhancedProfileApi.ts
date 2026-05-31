import { getProfile, updateProfile } from "@/services/profileApi";
import { EnhancedProfile, TemporaryAIProfileFields } from "@/types/enhancedProfile";
import {
  initialTemporaryAIProfileFields,
  loadTemporaryAIProfileFields,
  mergeEnhancedProfile,
  saveTemporaryAIProfileFields,
} from "@/utils/tempEnhancedProfileStorage";
import { UserProfile } from "@/types/profile";

const toBaseProfile = (profile: EnhancedProfile): UserProfile => ({
  fullName: profile.fullName,
  email: profile.email,
  education: profile.education,
  skills: profile.skills,
  careerGoal: profile.careerGoal,
  jobTitle: profile.jobTitle,
  experienceLevel: profile.experienceLevel,
  targetRole: profile.targetRole,
  yearsOfExperience: profile.yearsOfExperience,
  preferredIndustry: profile.preferredIndustry,
  workPreference: profile.workPreference,
  preferredLocation: profile.preferredLocation,
  portfolioUrl: profile.portfolioUrl,
  isProfilePublic: profile.isProfilePublic,
  linkedinUrl: profile.linkedinUrl,
  githubUrl: profile.githubUrl,
  certifications: profile.certifications,
  tools: profile.tools,
  strengths: profile.strengths,
  improvementAreas: profile.improvementAreas,
  aiSummary: profile.aiSummary,
  visibility: profile.visibility,
});

const toTemporaryFields = (profile: EnhancedProfile): TemporaryAIProfileFields => ({
  targetRole: profile.targetRole,
  yearsOfExperience: profile.yearsOfExperience,
  preferredIndustry: profile.preferredIndustry,
  workPreference: profile.workPreference,
  preferredLocation: profile.preferredLocation,
  portfolioUrl: profile.portfolioUrl,
  linkedinUrl: profile.linkedinUrl,
  githubUrl: profile.githubUrl,
  certifications: profile.certifications,
  tools: profile.tools,
  strengths: profile.strengths,
  improvementAreas: profile.improvementAreas,
  aiSummary: profile.aiSummary,
});

export const getEnhancedProfile = async (): Promise<EnhancedProfile> => {
  const profile = await getProfile();
  const temporaryFields = loadTemporaryAIProfileFields();
  return mergeEnhancedProfile(profile, temporaryFields);
};

export const updateEnhancedProfile = async (
  profile: EnhancedProfile,
): Promise<EnhancedProfile> => {
  const savedProfile = await updateProfile(toBaseProfile(profile));
  const temporaryFields = toTemporaryFields(profile);
  saveTemporaryAIProfileFields(temporaryFields);
  return mergeEnhancedProfile(savedProfile, temporaryFields);
};

export const getTemporaryAIProfileDefaults =
  (): TemporaryAIProfileFields => initialTemporaryAIProfileFields;
