const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: [
                'request_received',
                'request_accepted',
                'request_declined',
                'request_countered',
                'request_message',
                'session_reminder',
                'noshow_alert',
                'dispute_filed',
                'credits_awarded',
                'exchange_completed',
                'global_learning_request',
                'global_learning_request_accepted',
                'global_learning_request_closed',
                'milestone_due_soon',
                'milestone_overdue',
                'plan_ai_ready',
                'recommendation_generated'
            ],
            required: [true, 'Notification type is required']
        },
        relatedId: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
