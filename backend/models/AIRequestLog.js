const mongoose = require('mongoose');

const AIRequestLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    endpoint: {
        type: String,
        required: true,
        index: true
    },
    provider: {
        type: String,
        default: '',
        index: true
    },
    model: {
        type: String,
        default: ''
    },
    intent: {
        type: String,
        default: ''
    },
    promptLength: {
        type: Number,
        default: 0
    },
    responseLength: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        required: true,
        index: true
    },
    httpStatus: {
        type: Number,
        default: 200
    },
    errorCode: {
        type: String,
        default: ''
    },
    errorMessage: {
        type: String,
        default: ''
    },
    latencyMs: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AIRequestLog', AIRequestLogSchema);
