const mongoose = require('mongoose');

const ResumeUploadLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    originalName: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        default: ''
    },
    mimeType: {
        type: String,
        default: ''
    },
    size: {
        type: Number,
        default: 0
    },
    targetRole: {
        type: String,
        default: '',
        index: true
    },
    providerUsed: {
        type: String,
        default: ''
    },
    modelUsed: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('ResumeUploadLog', ResumeUploadLogSchema);
