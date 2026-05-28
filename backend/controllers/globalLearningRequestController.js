const mongoose = require('mongoose');
const User = require('../models/User');
const TradeRequest = require('../models/TradeRequest');
const TradeRequestMessage = require('../models/TradeRequestMessage');
const GlobalLearningRequest = require('../models/GlobalLearningRequest');
const {
    validateGlobalLearningRequestDraft,
    normalizeGlobalLearningRequestDraft,
    resolveLearningRequestRecipients,
} = require('../services/globalLearningRequestService');
const { computeTradeRequestExpiry } = require('../services/tradeFlowService');
const { sendNotification, sendNotificationToMany } = require('../utils/notificationHelper');

const fail = (res, status, message) => res.status(status).json({ error: message });

const handleError = (res, error) => {
    if (error?.name === 'ValidationError') {
        const firstMessage = Object.values(error.errors || {})[0]?.message || error.message;
        return fail(res, 400, firstMessage);
    }
    if (error?.name === 'CastError') {
        return fail(res, 400, `Invalid ${error.path}`);
    }
    return fail(res, 500, error?.message || 'Internal server error');
};

const populateLearningRequest = (query) => query
    .populate('createdBy', 'fullName')
    .populate('acceptedBy', 'fullName')
    .populate('acceptedTradeRequestId', 'status proposedCredits proposedDuration');

exports.createGlobalLearningRequest = async (req, res) => {
    try {
        const validationError = validateGlobalLearningRequestDraft(req.body);
        if (validationError) return fail(res, 400, validationError);

        const draft = normalizeGlobalLearningRequestDraft(req.body);
        const creator = await User.findById(req.user.id).select('isSuspended');
        if (!creator) return fail(res, 404, 'Creator not found');
        if (creator.isSuspended) return fail(res, 403, 'Suspended users cannot create learning requests');

        const openCount = await GlobalLearningRequest.countDocuments({
            createdBy: req.user.id,
            status: 'open',
        });
        if (openCount >= 3) return fail(res, 400, 'You already have the maximum number of open learning requests');

        const learningRequest = await GlobalLearningRequest.create({
            createdBy: req.user.id,
            ...draft,
        });

        const recipients = await resolveLearningRequestRecipients({
            createdBy: req.user.id,
            skillWanted: draft.skillWanted,
        });

        await sendNotificationToMany(
            recipients.map((recipient) => recipient.userId),
            'global_learning_request',
            {
                relatedId: learningRequest._id,
                message: `${req.user.fullName || 'A user'} is looking for help learning ${draft.skillWanted}.`
            }
        );

        const populatedRequest = await populateLearningRequest(
            GlobalLearningRequest.findById(learningRequest._id)
        ).lean();

        res.status(201).json({
            request: populatedRequest,
            recipientsNotified: recipients.length,
        });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listGlobalLearningRequests = async (req, res) => {
    try {
        const requests = await populateLearningRequest(
            GlobalLearningRequest.find({
                status: 'open',
                expiresAt: { $gt: new Date() },
            }).sort({ createdAt: -1 })
        ).lean();

        res.json({ requests });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listMyGlobalLearningRequests = async (req, res) => {
    try {
        const requests = await populateLearningRequest(
            GlobalLearningRequest.find({ createdBy: req.user.id }).sort({ createdAt: -1 })
        ).lean();

        res.json({ requests });
    } catch (error) {
        handleError(res, error);
    }
};

exports.acceptGlobalLearningRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(requestId)) return fail(res, 400, 'Invalid learning request id');

        const helper = await User.findById(req.user.id).select('isSuspended blockedUsers fullName');
        if (!helper) return fail(res, 404, 'Helper not found');
        if (helper.isSuspended) return fail(res, 403, 'Suspended users cannot accept learning requests');

        const learningRequest = await GlobalLearningRequest.findById(requestId).populate('createdBy', 'fullName blockedUsers');
        if (!learningRequest) return fail(res, 404, 'Learning request not found');
        if (learningRequest.createdBy._id.toString() === req.user.id.toString()) {
            return fail(res, 400, 'You cannot accept your own learning request');
        }
        if (learningRequest.status !== 'open') return fail(res, 400, 'Learning request is not open');
        if (learningRequest.expiresAt && new Date(learningRequest.expiresAt) <= new Date()) {
            learningRequest.status = 'expired';
            await learningRequest.save();
            return fail(res, 400, 'Learning request has expired');
        }

        const creatorBlockedHelper = Array.isArray(learningRequest.createdBy.blockedUsers)
            && learningRequest.createdBy.blockedUsers.some((blockedUserId) => blockedUserId.toString() === req.user.id.toString());
        const helperBlockedCreator = Array.isArray(helper.blockedUsers)
            && helper.blockedUsers.some((blockedUserId) => blockedUserId.toString() === learningRequest.createdBy._id.toString());
        if (creatorBlockedHelper || helperBlockedCreator) {
            return fail(res, 403, 'This learning request is not available between these users');
        }

        const eligibleRecipients = await resolveLearningRequestRecipients({
            createdBy: learningRequest.createdBy._id,
            skillWanted: learningRequest.skillWanted,
        });
        const helperIsEligible = eligibleRecipients.some((recipient) => recipient.userId === req.user.id.toString());
        if (!helperIsEligible) {
            return fail(res, 403, 'You are not eligible to accept this learning request');
        }

        const session = await mongoose.startSession();
        let tradeRequest;
        let acceptedRequest;

        try {
            await session.withTransaction(async () => {
                acceptedRequest = await GlobalLearningRequest.findOneAndUpdate(
                    {
                        _id: learningRequest._id,
                        status: 'open',
                        expiresAt: { $gt: new Date() },
                    },
                    {
                        $set: {
                            status: 'accepted',
                            acceptedBy: req.user.id,
                            closedAt: new Date(),
                        }
                    },
                    { new: true, session }
                );

                if (!acceptedRequest) {
                    throw new Error('Learning request was already accepted');
                }

                const [createdTradeRequest] = await TradeRequest.create([{
                    from: req.user.id,
                    to: learningRequest.createdBy._id,
                    offeredSkill: `${learningRequest.skillWanted} mentoring`,
                    requestedSkill: learningRequest.skillWanted,
                    proposedCredits: Number(learningRequest.budgetCredits || 0),
                    proposedDuration: Number(learningRequest.preferredDuration),
                    status: 'accepted',
                    message: `Accepted from the community learning board: ${learningRequest.goalTitle}`,
                    expiresAt: computeTradeRequestExpiry(),
                }], { session });

                tradeRequest = createdTradeRequest;

                await GlobalLearningRequest.updateOne(
                    { _id: acceptedRequest._id },
                    { $set: { acceptedTradeRequestId: tradeRequest._id } },
                    { session }
                );

                await TradeRequestMessage.create([{
                    tradeRequestId: tradeRequest._id,
                    senderId: req.user.id,
                    readBy: [req.user.id],
                    message: `Community learning request accepted for ${learningRequest.skillWanted}. Goal: ${learningRequest.goalTitle}. ${learningRequest.description || ''}`.trim(),
                    systemMessage: true,
                }], { session });
            });
        } catch (error) {
            if (error.message === 'Learning request was already accepted') {
                return fail(res, 409, error.message);
            }
            throw error;
        } finally {
            session.endSession();
        }

        await sendNotification(learningRequest.createdBy._id, 'global_learning_request_accepted', {
            relatedId: acceptedRequest?._id || learningRequest._id,
            message: `${req.user.fullName || 'A user'} accepted your request to learn ${learningRequest.skillWanted}.`
        });

        const populatedRequest = await populateLearningRequest(
            GlobalLearningRequest.findById(acceptedRequest?._id || learningRequest._id)
        ).lean();

        res.json({ request: populatedRequest, tradeRequest });
    } catch (error) {
        handleError(res, error);
    }
};

exports.cancelGlobalLearningRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(requestId)) return fail(res, 400, 'Invalid learning request id');

        const learningRequest = await GlobalLearningRequest.findById(requestId);
        if (!learningRequest) return fail(res, 404, 'Learning request not found');
        if (learningRequest.createdBy.toString() !== req.user.id.toString()) {
            return fail(res, 403, 'Not authorized to cancel this learning request');
        }
        if (learningRequest.status !== 'open') {
            return fail(res, 400, 'Only open learning requests can be cancelled');
        }

        learningRequest.status = 'cancelled';
        learningRequest.closedAt = new Date();
        await learningRequest.save();

        const populatedRequest = await populateLearningRequest(
            GlobalLearningRequest.findById(learningRequest._id)
        ).lean();

        res.json({ request: populatedRequest });
    } catch (error) {
        handleError(res, error);
    }
};

exports.__testables = {
    validateGlobalLearningRequestDraft,
    normalizeGlobalLearningRequestDraft,
    resolveLearningRequestRecipients,
};
