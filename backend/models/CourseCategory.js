const mongoose = require('mongoose');

const CourseCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            unique: true,
            maxlength: 120
        },
        slug: {
            type: String,
            required: [true, 'Category slug is required'],
            trim: true,
            unique: true,
            lowercase: true,
            maxlength: 140
        },
        description: {
            type: String,
            default: '',
            maxlength: 500
        },
        icon: {
            type: String,
            default: ''
        },
        sortOrder: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true,
        bufferCommands: false
    }
);

CourseCategorySchema.index({ slug: 1 }, { unique: true });
CourseCategorySchema.index({ sortOrder: 1, name: 1 });

module.exports = mongoose.model('CourseCategory', CourseCategorySchema);
