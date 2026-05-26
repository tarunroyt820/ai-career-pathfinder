const User = require('../models/User');
const Message = require('../models/Message');
const CareerPlan = require('../models/CareerPlan');
const AIRequestLog = require('../models/AIRequestLog');
const ResumeUploadLog = require('../models/ResumeUploadLog');
const profileCache = require('../utils/profileCache');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;

        // Remove sensitive fields if present
        delete updates.password;
        delete updates.email;
        delete updates._id;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.json({
            message: "Profile updated successfully",
            profile: user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password -email -createdAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            ...user._doc,
            isPublic: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Profile photo file is required' });
        }

        const profilePhotoUrl = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { profilePhotoUrl } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile photo uploaded successfully',
            profilePhotoUrl,
            profile: user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('fullName email');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await Promise.all([
            User.deleteOne({ _id: userId }),
            Message.deleteMany({ userId }),
            CareerPlan.deleteMany({ userId }),
            AIRequestLog.deleteMany({ userId }),
            ResumeUploadLog.deleteMany({ userId }),
        ]);

        profileCache.invalidate(userId);

        return res.json({
            success: true,
            message: 'Account and related data deleted successfully',
            data: user,
        });
    } catch (error) {
        console.error('deleteAccount failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
};
