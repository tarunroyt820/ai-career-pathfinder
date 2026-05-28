const SkillProfile = require('../models/SkillProfile');
const User = require('../models/User');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeGlobalLearningRequestDraft = (payload = {}) => ({
    skillWanted: String(payload.skillWanted || '').trim(),
    goalTitle: String(payload.goalTitle || '').trim(),
    description: String(payload.description || '').trim(),
    experienceLevel: String(payload.experienceLevel || 'beginner').trim().toLowerCase(),
    preferredDuration: Number(payload.preferredDuration),
    budgetCredits: payload.budgetCredits === '' || payload.budgetCredits == null ? 0 : Number(payload.budgetCredits),
});

const validateGlobalLearningRequestDraft = (payload = {}) => {
    const draft = normalizeGlobalLearningRequestDraft(payload);

    if (!draft.skillWanted) return 'Skill wanted is required';
    if (!draft.goalTitle) return 'Goal title is required';
    if (!['beginner', 'intermediate', 'advanced'].includes(draft.experienceLevel)) {
        return 'Experience level must be beginner, intermediate, or advanced';
    }
    if (!Number.isFinite(draft.preferredDuration) || draft.preferredDuration < 15) {
        return 'Preferred duration must be at least 15 minutes';
    }
    if (!Number.isFinite(draft.budgetCredits) || draft.budgetCredits < 0) {
        return 'Budget credits cannot be negative';
    }

    return null;
};

const resolveLearningRequestRecipients = async ({ createdBy, skillWanted }) => {
    const creator = await User.findById(createdBy).select('blockedUsers');
    const creatorBlocked = new Set((creator?.blockedUsers || []).map((id) => id.toString()));
    const exactSkillRegex = new RegExp(`^${escapeRegex(String(skillWanted || '').trim())}$`, 'i');

    const profiles = await SkillProfile.find({
        userId: { $ne: createdBy },
        isActive: true,
        'skillsOffered.name': { $regex: exactSkillRegex },
    }).populate({
        path: 'userId',
        select: '_id isSuspended blockedUsers fullName',
        match: { isSuspended: false }
    }).lean();

    const recipients = [];
    for (const profile of profiles) {
        const user = profile.userId;
        if (!user?._id) continue;
        const recipientId = user._id.toString();
        const recipientBlockedCreator = Array.isArray(user.blockedUsers)
            && user.blockedUsers.some((blockedUserId) => blockedUserId.toString() === String(createdBy));

        if (creatorBlocked.has(recipientId) || recipientBlockedCreator) continue;

        recipients.push({
            userId: recipientId,
            fullName: user.fullName || 'A user',
        });
    }

    const uniqueRecipients = [];
    const seen = new Set();
    for (const recipient of recipients) {
        if (seen.has(recipient.userId)) continue;
        seen.add(recipient.userId);
        uniqueRecipients.push(recipient);
    }

    return uniqueRecipients;
};

module.exports = {
    normalizeGlobalLearningRequestDraft,
    validateGlobalLearningRequestDraft,
    resolveLearningRequestRecipients,
};
