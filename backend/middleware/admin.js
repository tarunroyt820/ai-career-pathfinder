const adminMiddleware = (req, res, next) => {
    const adminIds = String(process.env.ADMIN_USER_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

    const userId = String(req.user?.id || req.user?._id || '');
    const isRoleAdmin = req.user?.role === 'admin';
    const isEnvAdmin = adminIds.includes(userId);

    if (!req.user || (!isRoleAdmin && !isEnvAdmin)) {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    return next();
};

module.exports = adminMiddleware;
