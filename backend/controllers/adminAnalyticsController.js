const User = require('../models/User');
const CareerPlan = require('../models/CareerPlan');
const AIRequestLog = require('../models/AIRequestLog');
const ResumeUploadLog = require('../models/ResumeUploadLog');

const getMonthlySeries = (items) => items.map((item) => ({
    month: item._id,
    count: item.count
}));

exports.getSummary = async (_req, res) => {
    try {
        const now = Date.now();
        const sevenDaysAgo = new Date(now - (7 * 24 * 60 * 60 * 1000));

        const [
            totalUsers,
            totalCareerPlans,
            totalResumesUploaded,
            totalAIRequests,
            activeUsers,
            popularRolesRaw,
            userGrowthRaw,
            planCreationRaw,
            providerUsageRaw,
            failedAIRequests
        ] = await Promise.all([
            User.countDocuments(),
            CareerPlan.countDocuments(),
            ResumeUploadLog.countDocuments(),
            AIRequestLog.countDocuments(),
            User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo } }),
            CareerPlan.aggregate([
                { $group: { _id: '$targetRole', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 }
            ]),
            User.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            CareerPlan.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            AIRequestLog.aggregate([
                {
                    $group: {
                        _id: '$provider',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            AIRequestLog.countDocuments({ status: 'failed' })
        ]);

        return res.json({
            success: true,
            data: {
                totals: {
                    totalUsers,
                    totalCareerPlans,
                    totalResumesUploaded,
                    totalAIRequests,
                    activeUsers
                },
                charts: {
                    popularRoles: popularRolesRaw.map((item) => ({
                        role: item._id || 'Unknown',
                        count: item.count
                    })),
                    userGrowth: getMonthlySeries(userGrowthRaw),
                    planCreationStats: getMonthlySeries(planCreationRaw)
                },
                aiUsage: {
                    failedRequests: failedAIRequests,
                    byProvider: providerUsageRaw.map((item) => ({
                        provider: item._id || 'unknown',
                        count: item.count
                    }))
                }
            }
        });
    } catch (error) {
        console.error('Admin summary failed:', error);
        return res.status(500).json({ success: false, message: 'Analytics error' });
    }
};

exports.getAiLogs = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
        const skip = (page - 1) * limit;

        const filter = q
            ? {
                $or: [
                    { provider: { $regex: q, $options: 'i' } },
                    { endpoint: { $regex: q, $options: 'i' } },
                    { errorMessage: { $regex: q, $options: 'i' } },
                    { errorCode: { $regex: q, $options: 'i' } }
                ]
            }
            : {};

        const [items, total] = await Promise.all([
            AIRequestLog.find(filter)
                .populate('userId', 'fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AIRequestLog.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('getAiLogs failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch AI logs' });
    }
};

exports.getFailedAiRequests = async (_req, res) => {
    try {
        const items = await AIRequestLog.find({ status: 'failed' })
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return res.json({ success: true, data: items });
    } catch (error) {
        console.error('getFailedAiRequests failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch failed AI requests' });
    }
};
