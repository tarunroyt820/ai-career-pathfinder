export type Education = {
    college: string;
    degree: string;
    graduationYear: string;
};

export interface UserProfile {
    fullName: string;
    email: string;
    education: Education;
    skills: string[];
    careerGoal: string;
    jobTitle?: string;
    experienceLevel?: string;
}
