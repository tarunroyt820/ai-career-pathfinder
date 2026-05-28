const mongoose = require('mongoose');

const GlobalLearningRequestSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        skillWanted: {
            type: String,
            required: [true, 'Skill wanted is required'],
            trim: true,
            maxlength: [120, 'Skill wanted cannot exceed 120 characters']
        },
        goalTitle: {
            type: String,
            required: [true, 'Goal title is required'],
            trim: true,
            maxlength: [160, 'Goal title cannot exceed 160 characters']
        },
        description: {
            type: String,
            default: '',
            trim: true,
            maxlength: [1200, 'Description cannot exceed 1200 characters']
        },
        experienceLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner'
        },
        preferredDuration: {
            type: Number,
            required: [true, 'Preferred duration is required'],
            min: [15, 'Preferred duration must be at least 15 minutes']
        },
        budgetCredits: {
            type: Number,
            default: 0,
            min: [0, 'Budget credits cannot be negative']
        },
        visibility: {
            type: String,
            enum: ['matched_only'],
            default: 'matched_only'
        },
        status: {
            type: String,
            enum: ['open', 'accepted', 'cancelled', 'expired', 'closed'],
            default: 'open',
            index: true
        },
        acceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        acceptedTradeRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TradeRequest',
            default: null
        },
        expiresAt: {
            type: Date,
            default: function defaultExpiry() {
                return new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
            },
            index: true
        },
        closedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

GlobalLearningRequestSchema.index({ createdBy: 1, createdAt: -1 });
GlobalLearningRequestSchema.index({ skillWanted: 1, status: 1 });
GlobalLearningRequestSchema.index({ acceptedBy: 1 });

module.exports = mongoose.model('GlobalLearningRequest', GlobalLearningRequestSchema);
