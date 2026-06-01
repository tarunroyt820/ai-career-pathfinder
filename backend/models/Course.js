const mongoose = require('mongoose');

const SUPPORTED_PLATFORMS = [
    'YouTube',
    'Coursera',
    'Udemy',
    'AWS Skill Builder',
    'Microsoft Learn',
    'Google Cloud Skills Boost',
    'freeCodeCamp',
    'GeeksforGeeks',
    'W3Schools',
    'MDN Docs'
];

const SUPPORTED_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const SUPPORTED_STATUSES = ['draft', 'published', 'archived'];

const CourseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
            maxlength: 180
        },
        slug: {
            type: String,
            required: [true, 'Course slug is required'],
            trim: true,
            unique: true,
            lowercase: true,
            maxlength: 220
        },
        shortDescription: {
            type: String,
            required: [true, 'Short description is required'],
            trim: true,
            maxlength: 240
        },
        fullDescription: {
            type: String,
            required: [true, 'Full description is required'],
            trim: true,
            maxlength: 4000
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CourseCategory',
            required: [true, 'Category is required'],
            index: true
        },
        categoryName: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            index: true
        },
        platform: {
            type: String,
            required: [true, 'Platform is required'],
            enum: SUPPORTED_PLATFORMS,
            index: true
        },
        courseUrl: {
            type: String,
            required: [true, 'Course URL is required'],
            trim: true
        },
        thumbnailUrl: {
            type: String,
            default: '',
            trim: true
        },
        instructor: {
            type: String,
            required: [true, 'Instructor is required'],
            trim: true,
            maxlength: 120
        },
        durationLabel: {
            type: String,
            required: [true, 'Duration is required'],
            trim: true,
            maxlength: 60
        },
        difficulty: {
            type: String,
            required: [true, 'Difficulty is required'],
            enum: SUPPORTED_DIFFICULTIES,
            index: true
        },
        language: {
            type: String,
            default: 'English',
            trim: true,
            maxlength: 60
        },
        isFree: {
            type: Boolean,
            default: true
        },
        tags: {
            type: [String],
            default: []
        },
        sourceType: {
            type: String,
            default: 'external-course',
            trim: true
        },
        status: {
            type: String,
            enum: SUPPORTED_STATUSES,
            default: 'draft',
            index: true
        },
        featured: {
            type: Boolean,
            default: false,
            index: true
        },
        viewCount: {
            type: Number,
            default: 0,
            min: 0
        },
        redirectCount: {
            type: Number,
            default: 0,
            min: 0
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true,
        bufferCommands: false
    }
);

CourseSchema.index({ status: 1, featured: 1, createdAt: -1 });
CourseSchema.index({ categoryId: 1, difficulty: 1, platform: 1 });
CourseSchema.index({ title: 'text', shortDescription: 'text', instructor: 'text', tags: 'text', categoryName: 'text' });

module.exports = {
    Course: mongoose.model('Course', CourseSchema),
    SUPPORTED_PLATFORMS,
    SUPPORTED_DIFFICULTIES,
    SUPPORTED_STATUSES
};
