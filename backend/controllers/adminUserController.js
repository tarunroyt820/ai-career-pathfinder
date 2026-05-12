const User = require('../models/User');
const Message = require('../models/Message');
const CareerPlan = require('../models/CareerPlan');
const AIRequestLog = require('../models/AIRequestLog');
const ResumeUploadLog = require('../models/ResumeUploadLog');

exports.listUsers = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
        const skip = (page - 1) * limit;

        const filter = q
            ? {
                $or: [
                    { fullName: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                    { careerGoal: { $regex: q, $options: 'i' } },
                    { jobTitle: { $regex: q, $options: 'i' } }
                ]
            }
            : {};

        const [items, total] = await Promise.all([
            User.find(filter)
                .select('fullName email role isEmailVerified isSuspended suspensionReason createdAt lastActiveAt jobTitle careerGoal')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
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
        console.error('listUsers failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

exports.suspendUser = async (req, res) => {
    try {
        const userId = String(req.params.id || '');
        const reason = String(req.body.reason || 'Suspended by admin').trim();

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User id is required' });
        }

        if (String(req.user._id) === userId) {
            return res.status(400).json({ success: false, message: 'You cannot suspend yourself' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                isSuspended: true,
                suspensionReason: reason,
                suspendedAt: new Date()
            },
            { new: true }
        ).select('fullName email isSuspended suspensionReason suspendedAt');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, data: user });
    } catch (error) {
        console.error('suspendUser failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to suspend user' });
    }
};

exports.unsuspendUser = async (req, res) => {
    try {
        const userId = String(req.params.id || '');

        const user = await User.findByIdAndUpdate(
            userId,
            {
                isSuspended: false,
                suspensionReason: '',
                suspendedAt: null
            },
            { new: true }
        ).select('fullName email isSuspended');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({ success: true, data: user });
    } catch (error) {
        console.error('unsuspendUser failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to unsuspend user' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = String(req.params.id || '');

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User id is required' });
        }

        if (String(req.user._id) === userId) {
            return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
        }

        const user = await User.findById(userId).select('fullName email');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await Promise.all([
            User.deleteOne({ _id: userId }),
            Message.deleteMany({ userId }),
            CareerPlan.deleteMany({ userId }),
            AIRequestLog.deleteMany({ userId }),
            ResumeUploadLog.deleteMany({ userId })
        ]);

        return res.json({
            success: true,
            message: 'User and related records deleted',
            data: user
        });
    } catch (error) {
        console.error('deleteUser failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};
