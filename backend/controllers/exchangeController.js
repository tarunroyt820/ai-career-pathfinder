const mongoose = require('mongoose');
const User = require('../models/User');
const SkillProfile = require('../models/SkillProfile');
const Availability = require('../models/Availability');
const TradeRequest = require('../models/TradeRequest');
const Agreement = require('../models/Agreement');
const Session = require('../models/Session');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const TradeRequestMessage = require('../models/TradeRequestMessage');
const matchingService = require('../services/matchingService');
const penaltyService = require('../services/penaltyService');
const {
    buildTradeAgreement,
    canAcceptTradeRequest,
    computeTradeRequestExpiry,
    normalizeTradeMessage,
    validateTradeRequestDraft
} = require('../services/tradeFlowService');
const { updateTrustScore } = require('../services/trustScoreService');
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
    if (error?.code === 11000) {
        return fail(res, 409, 'Duplicate record');
    }
    return fail(res, 500, error?.message || 'Internal server error');
};

const parseTime = (value) => {
    if (typeof value !== 'string') return null;
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
};

const ensureAgreementParticipant = (agreement, userId) => {
    return agreement.participants.some((participantId) => participantId.toString() === userId.toString());
};

const ensureTradeRequestParticipant = (tradeRequest, userId) => {
    return tradeRequest?.from?.toString() === userId.toString() || tradeRequest?.to?.toString() === userId.toString();
};

const getTradeRequestOtherParticipant = (tradeRequest, userId) => {
    if (!tradeRequest) return null;
    return tradeRequest.from.toString() === userId.toString() ? tradeRequest.to : tradeRequest.from;
};

const toObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return new mongoose.Types.ObjectId(id);
};

const getAdminUserIds = () => {
    const raw = process.env.ADMIN_USER_IDS || '';
    return raw
        .split(',')
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));
};

const addUniqueAchievement = (achievements, achievement) => {
    if (!achievement) return;
    if (!achievements.includes(achievement)) {
        achievements.push(achievement);
    }
};

const updateCompletionRewards = async (userId, completedAt = new Date()) => {
    const user = await User.findById(userId).select('completionStreak lastCompletionDate achievements');
    if (!user) return;

    const now = completedAt instanceof Date ? completedAt : new Date(completedAt);
    if (Number.isNaN(now.getTime())) return;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const previousCompletion = user.lastCompletionDate ? new Date(user.lastCompletionDate) : null;
    let completionStreak = Number(user.completionStreak || 0);

    if (previousCompletion && !Number.isNaN(previousCompletion.getTime())) {
        const previousDay = previousCompletion.toDateString();
        const today = now.toDateString();
        const yesterdayDay = yesterday.toDateString();

        if (previousDay === today) {
            completionStreak = Number(user.completionStreak || 0);
        } else if (previousDay === yesterdayDay) {
            completionStreak += 1;
        } else {
            completionStreak = 1;
        }
    } else {
        completionStreak = 1;
    }

    const [completedAgreements, totalAgreements] = await Promise.all([
        Agreement.countDocuments({ participants: userId, status: 'completed' }),
        Agreement.countDocuments({ participants: userId })
    ]);

    const completionRate = totalAgreements > 0 ? completedAgreements / totalAgreements : 0;
    const achievements = Array.isArray(user.achievements) ? [...user.achievements] : [];

    if (completedAgreements === 5) addUniqueAchievement(achievements, '5 Exchanges Completed');
    if (completedAgreements === 10) addUniqueAchievement(achievements, '10 Exchanges Completed');
    if (completionRate >= 0.9 && completedAgreements >= 10) addUniqueAchievement(achievements, 'Reliable Mentor');
    if (completionStreak >= 5) addUniqueAchievement(achievements, '5-Day Completion Streak');

    await User.updateOne(
        { _id: userId },
        {
            $set: {
                completionStreak,
                lastCompletionDate: now,
                completionRate,
                achievements: [...new Set(achievements)]
            }
        }
    );
};

const updateResponseRewards = async (userId, tradeRequestCreatedAt) => {
    const user = await User.findById(userId).select('responseStreak achievements');
    if (!user) return;

    const createdAt = tradeRequestCreatedAt instanceof Date ? tradeRequestCreatedAt : new Date(tradeRequestCreatedAt);
    const respondedWithin24Hours = !Number.isNaN(createdAt.getTime())
        ? (Date.now() - createdAt.getTime()) <= (24 * 60 * 60 * 1000)
        : false;

    let responseStreak = Number(user.responseStreak || 0);
    if (respondedWithin24Hours) {
        responseStreak += 1;
    } else {
        responseStreak = 0;
    }

    const achievements = Array.isArray(user.achievements) ? [...user.achievements] : [];
    if (responseStreak >= 3) addUniqueAchievement(achievements, 'Fast Responder');
    if (responseStreak >= 7) addUniqueAchievement(achievements, '7-Day Response Streak');

    await User.updateOne(
        { _id: userId },
        {
            $set: {
                responseStreak,
                achievements: [...new Set(achievements)]
            }
        }
    );
};

exports.upsertSkillProfile = async (req, res) => {
    try {
        const { skillsOffered = [], skillsWanted = [], bio = '', hourlyRate = 0, isActive = true } = req.body;

        if (!Array.isArray(skillsOffered) || !Array.isArray(skillsWanted)) {
            return fail(res, 400, 'skillsOffered and skillsWanted must be arrays');
        }
        if (skillsOffered.length > 5) return fail(res, 400, 'Maximum 5 offered skills allowed');
        if (skillsWanted.length > 5) return fail(res, 400, 'Maximum 5 wanted skills allowed');

        const profile = await SkillProfile.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { skillsOffered, skillsWanted, bio, hourlyRate, isActive } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ profile });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getSkillProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return fail(res, 400, 'Invalid userId');

        const profile = await SkillProfile.findOne({ userId }).populate('userId', 'fullName');
        if (!profile) return fail(res, 404, 'Skill profile not found');

        res.json({ profile });
    } catch (error) {
        handleError(res, error);
    }
};

exports.setAvailability = async (req, res) => {
    try {
        const { weeklySlots = [], blockedDates = [], timezone = 'UTC' } = req.body;
        if (!Array.isArray(weeklySlots)) return fail(res, 400, 'weeklySlots must be an array');

        const grouped = {};
        for (const slot of weeklySlots) {
            const day = slot?.day;
            const start = parseTime(slot?.startTime);
            const end = parseTime(slot?.endTime);
            if (!day || start === null || end === null) {
                return fail(res, 400, 'Invalid slot format. Use { day, startTime, endTime }');
            }
            if (end <= start) return fail(res, 400, 'endTime must be after startTime');
            grouped[day] = grouped[day] || [];
            grouped[day].push({ start, end });
        }

        for (const day of Object.keys(grouped)) {
            const sorted = grouped[day].sort((a, b) => a.start - b.start);
            for (let i = 1; i < sorted.length; i += 1) {
                if (sorted[i].start < sorted[i - 1].end) {
                    return fail(res, 400, `Overlapping slots found for ${day}`);
                }
            }
        }

        const availability = await Availability.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { weeklySlots, blockedDates, timezone } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.json({ availability });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getAvailability = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return fail(res, 400, 'Invalid userId');
        const availability = await Availability.findOne({ userId });
        if (!availability) return fail(res, 404, 'Availability not found');
        res.json({ availability });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getMatches = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { skill = '', page = 1, limit = 10 } = req.query;
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const me = await SkillProfile.findOne({ userId: currentUserId }).lean();
        const wanted = Array.isArray(me?.skillsWanted) ? me.skillsWanted.map((s) => s.name).filter(Boolean) : [];

        const filterSkills = skill ? [skill] : wanted;
        const query = {
            userId: { $ne: currentUserId },
            isActive: true
        };

        if (filterSkills.length > 0) {
            query['skillsOffered.name'] = { $in: filterSkills };
        }

        const total = await SkillProfile.countDocuments(query);
        const matchesRaw = await SkillProfile.find(query)
            .populate('userId', 'fullName')
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit)
            .lean();

        const myAvailability = await Availability.findOne({ userId: currentUserId }).lean();
        const matches = await Promise.all(
            matchesRaw.map(async (profile) => {
                const [candidateAvailability, candidateUser] = await Promise.all([
                    Availability.findOne({ userId: profile.userId._id }).lean(),
                    User.findById(profile.userId._id).select('trustScore').lean()
                ]);

                const scoring = matchingService.calculateMatchScore(
                    {
                        userId: currentUserId,
                        skillsOffered: me?.skillsOffered || [],
                        skillsWanted: me?.skillsWanted || [],
                        trustScore: req.user.trustScore,
                        availability: myAvailability || null
                    },
                    {
                        userId: profile.userId._id,
                        skillsOffered: profile.skillsOffered || [],
                        skillsWanted: profile.skillsWanted || [],
                        trustScore: candidateUser?.trustScore ?? 100,
                        availability: candidateAvailability || null
                    }
                );

                return {
                    ...profile,
                    matchScore: scoring.score,
                    matchReasons: scoring.reasons
                };
            })
        );

        matches.sort((a, b) => b.matchScore - a.matchScore);
        res.json({ matches, total, page: parsedPage });
    } catch (error) {
        handleError(res, error);
    }
};

// Universal search for skill-exchange: search by username or skill
exports.searchExchangeUsers = async (req, res) => {
    try {
        const { q = '', type = 'all', page = 1, limit = 20 } = req.query;
        const queryText = String(q || '').trim();
        if (!queryText) return fail(res, 400, 'q (query) parameter is required');

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        const regex = new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        let profiles = [];

        if (type === 'name' || type === 'all' || type === 'user') {
            // find users by fullName and populate their skill profiles
            const userQuery = mongoose.Types.ObjectId.isValid(queryText)
                ? { $or: [{ fullName: regex }, { _id: queryText }] }
                : { fullName: regex };

            const users = await User.find(userQuery).select('_id fullName').lean();
            const userIds = users.map((u) => u._id);
            if (userIds.length > 0) {
                const found = await SkillProfile.find({ userId: { $in: userIds } })
                    .populate('userId', 'fullName')
                    .skip((parsedPage - 1) * parsedLimit)
                    .limit(parsedLimit)
                    .lean();
                profiles = profiles.concat(found);
            }
        }

        if (type === 'skill' || type === 'all') {
            // search offered or wanted skills by name
            const skillQuery = {
                $or: [
                    { 'skillsOffered.name': { $regex: regex } },
                    { 'skillsWanted.name': { $regex: regex } }
                ],
                isActive: true
            };
            const foundBySkill = await SkillProfile.find(skillQuery)
                .populate('userId', 'fullName')
                .skip((parsedPage - 1) * parsedLimit)
                .limit(parsedLimit)
                .lean();

            // merge avoiding duplicates by userId
            const existingIds = new Set(profiles.map((p) => p.userId && p.userId._id ? p.userId._id.toString() : String(p.userId)));
            for (const p of foundBySkill) {
                const uid = p.userId && p.userId._id ? p.userId._id.toString() : String(p.userId);
                if (!existingIds.has(uid)) {
                    profiles.push(p);
                    existingIds.add(uid);
                }
            }
        }

        // basic scoring: for now return profiles as-is and total count
        const total = profiles.length;
        res.json({ profiles, total, page: parsedPage });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createTradeRequest = async (req, res) => {
    try {
        const {
            to,
            offeredSkill,
            requestedSkill,
            proposedCredits,
            proposedDuration,
            message = ''
        } = req.body;

        const validationError = validateTradeRequestDraft({
            to,
            offeredSkill,
            requestedSkill,
            proposedCredits,
            proposedDuration
        });

        if (validationError) {
            return fail(res, 400, validationError);
        }

        if (to.toString() === req.user.id.toString()) return fail(res, 400, 'Cannot send request to yourself');
        if (!mongoose.Types.ObjectId.isValid(to)) return fail(res, 400, 'Invalid receiver user id');

        const sender = await User.findById(req.user.id).select('activeExchangeCount');
        if (!sender) return fail(res, 404, 'Sender not found');
        if (sender.activeExchangeCount >= 3) return fail(res, 400, 'Sender reached maximum active exchanges');

        const receiver = await User.findById(to).select('blockedUsers');
        if (!receiver) return fail(res, 404, 'Receiver not found');
        if (receiver.blockedUsers.some((blocked) => blocked.toString() === req.user.id.toString())) {
            return fail(res, 403, 'Receiver has blocked this sender');
        }

        const duplicate = await TradeRequest.findOne({
            from: req.user.id,
            to,
            offeredSkill,
            requestedSkill,
            status: 'pending'
        });
        if (duplicate) return fail(res, 409, 'Duplicate pending request exists');

        const expiresAt = computeTradeRequestExpiry();

        const tradeRequest = await TradeRequest.create({
            from: req.user.id,
            to,
            offeredSkill,
            requestedSkill,
            proposedCredits,
            proposedDuration,
            status: 'pending',
            message: normalizeTradeMessage(message),
            expiresAt
        });

        if (tradeRequest.message) {
            await TradeRequestMessage.create({
                tradeRequestId: tradeRequest._id,
                senderId: req.user.id,
                readBy: [req.user.id],
                message: tradeRequest.message
            });
        }

        await sendNotification(to, 'request_received', {
            relatedId: tradeRequest._id,
            message: `New trade request from ${req.user.fullName || 'a user'}`
        });

        res.status(201).json({ request: tradeRequest });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listTradeRequests = async (req, res) => {
    try {
        const { type = 'received' } = req.query;
        if (!['received', 'sent'].includes(type)) return fail(res, 400, 'type must be sent or received');

        const query = type === 'sent' ? { from: req.user.id } : { to: req.user.id };
        const requests = await TradeRequest.find(query)
            .sort({ createdAt: -1 })
            .populate('from', 'fullName')
            .populate('to', 'fullName');

        res.json({ requests, type });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getTradeRequestMessages = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, 400, 'Invalid trade request id');

        const tradeRequest = await TradeRequest.findById(id);
        if (!tradeRequest) return fail(res, 404, 'Trade request not found');
        if (!ensureTradeRequestParticipant(tradeRequest, req.user.id)) return fail(res, 403, 'Not authorized for this request');

        await TradeRequestMessage.updateMany(
            {
                tradeRequestId: tradeRequest._id,
                senderId: { $ne: req.user.id },
                readBy: { $ne: req.user.id }
            },
            {
                $addToSet: { readBy: req.user.id }
            }
        );

        const messages = await TradeRequestMessage.find({ tradeRequestId: tradeRequest._id })
            .populate('senderId', 'fullName profilePhotoUrl')
            .sort({ createdAt: 1 })
            .lean();

        res.json({ messages });
    } catch (error) {
        handleError(res, error);
    }
};

exports.sendTradeRequestMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const rawMessage = typeof req.body?.message === 'string' ? req.body.message : '';
        const message = rawMessage.trim();

        if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, 400, 'Invalid trade request id');
        if (!message) return fail(res, 400, 'Message required');
        if (message.length > 2000) return fail(res, 400, 'Message exceeds 2000 characters');

        const tradeRequest = await TradeRequest.findById(id);
        if (!tradeRequest) return fail(res, 404, 'Trade request not found');
        if (!ensureTradeRequestParticipant(tradeRequest, req.user.id)) return fail(res, 403, 'Not authorized for this request');
        if (['declined', 'expired'].includes(tradeRequest.status)) {
            return fail(res, 400, 'Cannot message on a closed request');
        }

        const requestMessage = await TradeRequestMessage.create({
            tradeRequestId: tradeRequest._id,
            senderId: req.user.id,
            readBy: [req.user.id],
            message
        });

        const populatedMessage = await TradeRequestMessage.findById(requestMessage._id)
            .populate('senderId', 'fullName profilePhotoUrl')
            .lean();

        const otherUserId = getTradeRequestOtherParticipant(tradeRequest, req.user.id);
        await sendNotification(otherUserId, 'request_message', {
            relatedId: tradeRequest._id,
            message: `${req.user.fullName || 'A user'} sent a message about your skill request`
        });

        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        handleError(res, error);
    }
};

exports.acceptTradeRequest = async (req, res) => {
    try {
        const tradeRequest = await TradeRequest.findById(req.params.id);
        if (!tradeRequest) return fail(res, 404, 'Trade request not found');
        if (tradeRequest.to.toString() !== req.user.id.toString()) return fail(res, 403, 'Not allowed to accept this request');

        // fetch sender and receiver details and perform basic checks
        const [receiver, sender] = await Promise.all([
            User.findById(req.user.id).select('blockedUsers activeExchangeCount'),
            User.findById(tradeRequest.from).select('activeExchangeCount')
        ]);

        if (!receiver) return fail(res, 404, 'Receiver not found');
        if (!sender) return fail(res, 404, 'Sender not found');
        if (receiver.blockedUsers.some((blocked) => blocked.toString() === tradeRequest.from.toString())) {
            return fail(res, 403, 'Blocked sender cannot be accepted');
        }

        const acceptanceCheck = canAcceptTradeRequest({ tradeRequest, sender, receiver });
        if (!acceptanceCheck.ok) {
            if (acceptanceCheck.expired) {
                tradeRequest.status = 'expired';
                await tradeRequest.save();
            }
            return fail(res, acceptanceCheck.statusCode, acceptanceCheck.message);
        }

        // Use a transaction to avoid partial state if supported
        let agreement;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                tradeRequest.status = 'accepted';
                await tradeRequest.save({ session });

                agreement = await Agreement.create([buildTradeAgreement(tradeRequest)], { session });

                await User.updateMany(
                    { _id: { $in: [tradeRequest.from, tradeRequest.to] } },
                    { $inc: { activeExchangeCount: 1 } },
                    { session }
                );
            });
        } finally {
            session.endSession();
        }

        // updateResponseRewards is safe to run after transaction commit
        await updateResponseRewards(req.user.id, tradeRequest.createdAt);

        const finalAgreement = Array.isArray(agreement) ? agreement[0] : agreement;
        if (finalAgreement?._id) {
            await TradeRequestMessage.create({
                tradeRequestId: tradeRequest._id,
                senderId: req.user.id,
                readBy: [req.user.id],
                message: `Request accepted. Let's continue the learning conversation in the active exchange chat.`,
                systemMessage: true
            });
        }

        // send notification for acceptance
        const agreementId = finalAgreement?._id;
        await sendNotification(tradeRequest.from, 'request_accepted', {
            relatedId: agreementId,
            message: 'Your trade request was accepted'
        });

        res.json({ request: tradeRequest, agreement: finalAgreement });
    } catch (error) {
        handleError(res, error);
    }
};

exports.declineTradeRequest = async (req, res) => {
    try {
        const tradeRequest = await TradeRequest.findById(req.params.id);
        if (!tradeRequest) return fail(res, 404, 'Trade request not found');
        if (tradeRequest.to.toString() !== req.user.id.toString()) return fail(res, 403, 'Not allowed to decline this request');
        if (tradeRequest.status !== 'pending') return fail(res, 400, 'Request is not pending');

        tradeRequest.status = 'declined';
        await tradeRequest.save();
        await updateResponseRewards(req.user.id, tradeRequest.createdAt);

        await TradeRequestMessage.create({
            tradeRequestId: tradeRequest._id,
            senderId: req.user.id,
            readBy: [req.user.id],
            message: 'Request declined.',
            systemMessage: true
        });

        await sendNotification(tradeRequest.from, 'request_declined', {
            relatedId: tradeRequest._id,
            message: 'Your trade request was declined'
        });

        res.json({ request: tradeRequest });
    } catch (error) {
        handleError(res, error);
    }
};

exports.counterTradeRequest = async (req, res) => {
    try {
        const { credits, duration, message = '' } = req.body;
        if (credits === undefined && duration === undefined && !message) {
            return fail(res, 400, 'Counter offer must include credits, duration, or message');
        }

        const tradeRequest = await TradeRequest.findById(req.params.id);
        if (!tradeRequest) return fail(res, 404, 'Trade request not found');
        if (tradeRequest.to.toString() !== req.user.id.toString()) return fail(res, 403, 'Not allowed to counter this request');
        if (tradeRequest.status !== 'pending') return fail(res, 400, 'Request is not pending');

        tradeRequest.status = 'countered';
        tradeRequest.counterOffer = { credits, duration, message };
        await tradeRequest.save();
        await updateResponseRewards(req.user.id, tradeRequest.createdAt);

        const counterSummary = [
            credits !== undefined ? `credits: ${credits}` : null,
            duration !== undefined ? `duration: ${duration} mins` : null,
            message ? `note: ${message}` : null
        ].filter(Boolean).join(' | ');

        await TradeRequestMessage.create({
            tradeRequestId: tradeRequest._id,
            senderId: req.user.id,
            readBy: [req.user.id],
            message: counterSummary ? `Counter offer proposed (${counterSummary})` : 'Counter offer proposed',
            systemMessage: true
        });

        await sendNotification(tradeRequest.from, 'request_countered', {
            relatedId: tradeRequest._id,
            message: `${req.user.fullName || 'A user'} sent a counter offer on your skill request`
        });

        res.json({ request: tradeRequest });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getAgreementById = async (req, res) => {
    try {
        const agreement = await Agreement.findById(req.params.id)
            .populate('participants', 'fullName')
            .populate('requestId');
        if (!agreement) return fail(res, 404, 'Agreement not found');
        if (!ensureAgreementParticipant(agreement, req.user.id)) return fail(res, 403, 'Not authorized for this agreement');
        res.json({ agreement });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listMyAgreements = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { participants: toObjectId(req.user.id) };
        if (status) query.status = status;

        const agreements = await Agreement.find(query)
            .sort({ createdAt: -1 })
            .populate('participants', 'fullName');
        res.json({ agreements });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createSession = async (req, res) => {
    try {
        const { agreementId, scheduledAt } = req.body;
        if (!agreementId || !scheduledAt) return fail(res, 400, 'agreementId and scheduledAt are required');
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) return fail(res, 404, 'Agreement not found');
        if (!ensureAgreementParticipant(agreement, req.user.id)) return fail(res, 403, 'Not authorized for this agreement');

        const session = await Session.create({
            agreementId,
            scheduledAt,
            participantConfirmations: [],
            status: 'scheduled'
        });
        res.status(201).json({ session });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listSessions = async (req, res) => {
    try {
        const { agreementId } = req.query;
        const agreementQuery = { participants: toObjectId(req.user.id) };
        if (agreementId) {
            if (!mongoose.Types.ObjectId.isValid(agreementId)) return fail(res, 400, 'Invalid agreementId');
            agreementQuery._id = agreementId;
        }

        const agreements = await Agreement.find(agreementQuery).select('_id');
        const agreementIds = agreements.map((agreement) => agreement._id);
        if (agreementIds.length === 0) {
            return res.json({ sessions: [] });
        }

        const sessionQuery = { agreementId: { $in: agreementIds } };
        if (agreementId) sessionQuery.agreementId = agreementId;

        const sessions = await Session.find(sessionQuery).sort({ scheduledAt: 1 });
        res.json({ sessions });
    } catch (error) {
        handleError(res, error);
    }
};

exports.confirmSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return fail(res, 404, 'Session not found');
        const agreement = await Agreement.findById(session.agreementId);
        if (!agreement) return fail(res, 404, 'Agreement not found');
        if (!ensureAgreementParticipant(agreement, req.user.id)) return fail(res, 403, 'Not authorized for this session');
        if (session.status === 'completed') return fail(res, 400, 'Session already completed');
        if (session.status !== 'scheduled') return fail(res, 400, 'Session is not schedulable for confirmation');

        const already = session.participantConfirmations.some(
            (confirmation) => confirmation.userId.toString() === req.user.id.toString()
        );
        if (!already) {
            session.participantConfirmations.push({ userId: req.user.id, confirmedAt: new Date() });
        }

        if (session.participantConfirmations.length >= agreement.participants.length) {
            session.status = 'completed';
            session.completedAt = new Date();
            agreement.status = 'completed';
            agreement.completedAt = new Date();
            await agreement.save();
            await User.updateMany(
                { _id: { $in: agreement.participants } },
                [
                    {
                        $set: {
                            activeExchangeCount: {
                                $max: [{ $subtract: ['$activeExchangeCount', 1] }, 0]
                            }
                        }
                    }
                ]
            );
            await Promise.all(agreement.participants.map((participantId) => updateTrustScore(participantId)));
            await sendNotificationToMany(agreement.participants, 'exchange_completed', {
                relatedId: agreement._id,
                message: 'Exchange completed successfully.'
            });
        }

        await session.save();
        res.json({ session });
    } catch (error) {
        handleError(res, error);
    }
};

exports.reportNoShow = async (req, res) => {
    try {
        const { reason, proof } = req.body;
        if (!reason || !proof) return fail(res, 400, 'No-show report must include reason and proof');

        const session = await Session.findById(req.params.id);
        if (!session) return fail(res, 404, 'Session not found');
        const agreement = await Agreement.findById(session.agreementId);
        if (!agreement) return fail(res, 404, 'Agreement not found');
        if (!ensureAgreementParticipant(agreement, req.user.id)) return fail(res, 403, 'Not authorized for this session');

        session.status = 'noshow';
        session.noShowReported = {
            by: req.user.id,
            at: new Date(),
            reason,
            proof
        };
        await session.save();

        const noShow = await penaltyService.detectNoShow(session._id);
        if (noShow.isNoShow && noShow.missingParticipants.length > 0) {
            const offenderId = noShow.missingParticipants[0];
            await penaltyService.applyPenalty(offenderId, `No-show reported: ${reason}`);
            await penaltyService.compensateVictim(req.user.id, 2);
            await updateTrustScore(req.user.id);

            await sendNotification(offenderId, 'noshow_alert', {
                relatedId: session._id,
                message: `You were reported for a no-show. Reason: ${reason}`
            });

            const adminIds = getAdminUserIds();
            if (adminIds.length > 0) {
                await sendNotificationToMany(adminIds, 'noshow_alert', {
                    relatedId: session._id,
                    message: `No-show reported for session ${session._id}.`
                });
            }

            await sendNotification(req.user.id, 'credits_awarded', {
                relatedId: session._id,
                message: 'You received 2 compensation credits for the reported no-show.'
            });
        }

        res.json({ session });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createDispute = async (req, res) => {
    try {
        const { agreementId, reason, description = '', evidence = [] } = req.body;
        if (!agreementId || !reason) return fail(res, 400, 'agreementId and reason are required');

        const agreement = await Agreement.findById(agreementId);
        if (!agreement) return fail(res, 404, 'Agreement not found');
        if (!ensureAgreementParticipant(agreement, req.user.id)) return fail(res, 403, 'Not authorized for this agreement');

        const existingOpen = await Dispute.findOne({
            agreementId,
            status: { $in: ['open', 'investigating'] }
        });
        if (existingOpen) return fail(res, 409, 'An open dispute already exists for this agreement');

        const dispute = await Dispute.create({
            agreementId,
            filedBy: req.user.id,
            reason,
            description,
            evidence,
            status: 'open'
        });

        await sendNotificationToMany(agreement.participants, 'dispute_filed', {
            relatedId: dispute._id,
            message: 'A dispute has been filed for this agreement.'
        });

        res.status(201).json({ dispute });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getDisputeById = async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.id).populate('agreementId');
        if (!dispute) return fail(res, 404, 'Dispute not found');

        const agreement = await Agreement.findById(dispute.agreementId);
        if (!agreement || !ensureAgreementParticipant(agreement, req.user.id)) {
            return fail(res, 403, 'Not authorized to view this dispute');
        }

        res.json({ dispute });
    } catch (error) {
        handleError(res, error);
    }
};

exports.createReview = async (req, res) => {
    try {
        const { agreementId, revieweeId, rating, comment = '' } = req.body;
        if (!agreementId || !revieweeId || !rating) {
            return fail(res, 400, 'agreementId, revieweeId and rating are required');
        }

        const agreement = await Agreement.findById(agreementId);
        if (!agreement) return fail(res, 404, 'Agreement not found');
        if (agreement.status !== 'completed') return fail(res, 400, 'Agreement must be completed before review');
        if (!ensureAgreementParticipant(agreement, req.user.id)) return fail(res, 403, 'Not authorized for this agreement');
        if (!ensureAgreementParticipant(agreement, revieweeId)) return fail(res, 400, 'Reviewee must be part of the agreement');
        if (revieweeId.toString() === req.user.id.toString()) return fail(res, 400, 'Cannot review yourself');

        const existing = await Review.findOne({ agreementId, reviewerId: req.user.id });
        if (existing) return fail(res, 409, 'Reviewer already submitted a review for this agreement');

        const review = await Review.create({
            agreementId,
            reviewerId: req.user.id,
            revieweeId,
            rating,
            comment
        });

        await updateTrustScore(revieweeId);
        res.status(201).json({ review });
    } catch (error) {
        handleError(res, error);
    }
};

exports.getReviewsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return fail(res, 400, 'Invalid userId');
        const reviews = await Review.find({ revieweeId: userId })
            .sort({ createdAt: -1 })
            .populate('reviewerId', 'fullName');
        res.json({ reviews });
    } catch (error) {
        handleError(res, error);
    }
};

exports.listNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ notifications });
    } catch (error) {
        handleError(res, error);
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { read: true } },
            { new: true }
        );
        if (!notification) return fail(res, 404, 'Notification not found');
        res.json({ notification });
    } catch (error) {
        handleError(res, error);
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        handleError(res, error);
    }
};
