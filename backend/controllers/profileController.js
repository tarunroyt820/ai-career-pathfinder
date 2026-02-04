const { mockProfile } = require('../data/mockData');

exports.getProfile = (req, res) => {
    res.json(mockProfile);
};

exports.updateProfile = (req, res) => {
    const updates = req.body;

    // Update mock in-memory data
    Object.keys(updates).forEach(key => {
        if (key in mockProfile) {
            mockProfile[key] = updates[key];
        }
    });

    res.json({
        message: "Profile updated successfully (Mock)",
        profile: mockProfile
    });
};

exports.getPublicProfile = (req, res) => {
    const { id } = req.params;
    // In mock, we just return the same profile for any ID
    res.json({
        ...mockProfile,
        id: id,
        isPublic: true
    });
};
