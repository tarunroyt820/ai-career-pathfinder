const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'First and last name required']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        index: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        default: null,
        select: false
    },
    passwordResetToken: {
        type: String,
        default: null,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        default: null,
        select: false
    },
    jobTitle: {
        type: String,
        default: ''
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'senior', ''],
        default: ''
    },
    careerGoal: {
        type: String,
        default: ''
    },
    targetRole: {
        type: String,
        default: ''
    },
    yearsOfExperience: {
        type: String,
        default: ''
    },
    preferredIndustry: {
        type: String,
        default: ''
    },
    workPreference: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite', 'flexible', ''],
        default: ''
    },
    preferredLocation: {
        type: String,
        default: ''
    },
    portfolioUrl: {
        type: String,
        default: ''
    },
    linkedinUrl: {
        type: String,
        default: ''
    },
    githubUrl: {
        type: String,
        default: ''
    },
    education: [
        {
            college: { type: String, default: '' },
            degree: { type: String, default: '' },
            graduationYear: { type: String, default: '' }
        }
    ],

    projects: [
        {
            title: { type: String, default: '' },
            description: { type: String, default: '' },
            link: { type: String, default: '' },
            startYear: { type: String, default: '' },
            endYear: { type: String, default: '' }
        }
    ],
    skills: {
        type: [String],
        default: []
    },
    tools: {
        type: [String],
        default: []
    },
    certifications: {
        type: [String],
        default: []
    },
    strengths: {
        type: [String],
        default: []
    },
    improvementAreas: {
        type: [String],
        default: []
    },
    credits: {
        type: Number,
        default: 10,
        min: [0, 'Credits cannot be negative']
    },
    trustScore: {
        type: Number,
        default: 100,
        min: [0, 'Trust score cannot be negative']
    },
    qualityScore: {
        type: Number,
        default: 0,
        index: true
    },
    completionRate: {
        type: Number,
        default: 0
    },
    responseRate: {
        type: Number,
        default: 1
    },
    activityScore: {
        type: Number,
        default: 0.2
    },
    riskFlags: {
        type: [String],
        default: []
    },
    achievements: {
        type: [String],
        default: []
    },
    completionStreak: {
        type: Number,
        default: 0
    },
    lastCompletionDate: {
        type: Date,
        default: null
    },
    responseStreak: {
        type: Number,
        default: 0
    },
    activeExchangeCount: {
        type: Number,
        default: 0,
        min: [0, 'Active exchange count cannot be negative'],
        validate: {
            validator: function validator(v) {
                return v <= 3;
            },
            message: 'Active exchange count cannot exceed 3'
        }
    },
    noShowCount: {
        type: Number,
        default: 0,
        min: [0, 'No-show count cannot be negative']
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    agreedToSkillTerms: {
        type: Boolean,
        default: false
    },
    profilePhotoUrl: {
        type: String,
        default: ''
    },
    isProfilePublic: {
        type: Boolean,
        default: true,
        index: true
    },
    visibility: {
        jobTitle: { type: Boolean, default: true },
        education: { type: Boolean, default: true },
        skills: { type: Boolean, default: true },
        profilePhotoUrl: { type: Boolean, default: true },
        tools: { type: Boolean, default: true },
        certifications: { type: Boolean, default: true },
        links: { type: Boolean, default: true },
        aiSummary: { type: Boolean, default: true },
        preferredLocation: { type: Boolean, default: true },
        careerGoal: { type: Boolean, default: true },
        targetRole: { type: Boolean, default: true },
        strengths: { type: Boolean, default: true },
        improvementAreas: { type: Boolean, default: true },
        yearsOfExperience: { type: Boolean, default: true },
        preferredIndustry: { type: Boolean, default: true },
        workPreference: { type: Boolean, default: true },
    },
    isSuspended: {
        type: Boolean,
        default: false,
        index: true
    },
    suspensionReason: {
        type: String,
        default: ''
    },
    suspendedAt: {
        type: Date,
        default: null
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    bufferCommands: false
});

module.exports = mongoose.model('User', UserSchema);
