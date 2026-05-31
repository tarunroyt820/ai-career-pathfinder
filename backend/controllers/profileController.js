const User = require('../models/User');
const Message = require('../models/Message');
const CareerPlan = require('../models/CareerPlan');
const AIRequestLog = require('../models/AIRequestLog');
const ResumeUploadLog = require('../models/ResumeUploadLog');
const profileCache = require('../utils/profileCache');
const jwt = require('jsonwebtoken');

const getRequesterId = (req) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.id || null;
    } catch (_error) {
        return null;
    }
};

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
        const requesterId = getRequesterId(req);
        const user = await User.findById(id).select('-password -email -createdAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isProfilePublic && requesterId !== String(user._id)) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If the requester is not the profile owner, respect per-field visibility
        if (requesterId !== String(user._id)) {
            const safe = { ...user._doc };
            const vis = user.visibility || {};

            // Fields to potentially hide
            const fieldMap = {
                jobTitle: 'jobTitle',
                education: 'education',
                skills: 'skills',
                profilePhotoUrl: 'profilePhotoUrl',
                tools: 'tools',
                certifications: 'certifications',
                links: ['portfolioUrl', 'linkedinUrl', 'githubUrl'],
                aiSummary: 'aiSummary',
                preferredLocation: 'preferredLocation',
                careerGoal: 'careerGoal',
                targetRole: 'targetRole',
                strengths: 'strengths',
                improvementAreas: 'improvementAreas',
                yearsOfExperience: 'yearsOfExperience',
                preferredIndustry: 'preferredIndustry',
                workPreference: 'workPreference',
            };

            for (const [key, mapTo] of Object.entries(fieldMap)) {
                if (vis[key] === false) {
                    if (Array.isArray(mapTo)) {
                        for (const f of mapTo) delete safe[f];
                    } else {
                        delete safe[mapTo];
                    }
                }
            }

            return res.json({ ...safe, isPublic: true });
        }

        // Owner or allowed viewer: return full profile
        return res.json({ ...user._doc, isPublic: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Profile photo file is required' });
        }

        // Basic server-side validation
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        const maxBytes = 3 * 1024 * 1024; // 3MB
        if (!allowed.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Unsupported file type' });
        }
        if (req.file.size && req.file.size > maxBytes) {
            return res.status(400).json({ message: 'File too large. Max 3 MB' });
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
