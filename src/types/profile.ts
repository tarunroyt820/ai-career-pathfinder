export type Education = {
    college: string;
    degree: string;
    graduationYear: string;
};

export type Project = {
    title: string;
    description: string;
    link: string;
    startYear: string;
    endYear: string;
};

export interface UserProfile {
    fullName: string;
    email: string;
    education: Education[];
    skills: string[];
    careerGoal: string;
    jobTitle?: string;
    experienceLevel?: string;
    profilePhotoUrl?: string;
    isProfilePublic?: boolean;
    targetRole?: string;
    yearsOfExperience?: string;
    preferredIndustry?: string;
    workPreference?: string;
    preferredLocation?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    certifications?: string[];
    tools?: string[];
    strengths?: string[];
    improvementAreas?: string[];
    aiSummary?: string;
    visibility?: {
        jobTitle?: boolean;
        education?: boolean;
        skills?: boolean;
        profilePhotoUrl?: boolean;
        tools?: boolean;
        certifications?: boolean;
        links?: boolean;
        aiSummary?: boolean;
        preferredLocation?: boolean;
        careerGoal?: boolean;
        targetRole?: boolean;
        strengths?: boolean;
        improvementAreas?: boolean;
        yearsOfExperience?: boolean;
        preferredIndustry?: boolean;
        workPreference?: boolean;
    };
    projects?: Project[];
}
