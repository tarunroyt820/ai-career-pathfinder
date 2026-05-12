const mongoose = require('mongoose');

const TradeRequestMessageSchema = new mongoose.Schema(
    {
        tradeRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TradeRequest',
            required: true,
            index: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readBy: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }],
            default: []
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        systemMessage: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

TradeRequestMessageSchema.index({ tradeRequestId: 1, createdAt: 1 });
TradeRequestMessageSchema.index({ tradeRequestId: 1, readBy: 1, createdAt: -1 });

module.exports = mongoose.model('TradeRequestMessage', TradeRequestMessageSchema);
