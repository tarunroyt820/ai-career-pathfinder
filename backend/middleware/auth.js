const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const unauthorizedMessage = 'Unauthorised. Please log in.';
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: unauthorizedMessage, message: unauthorizedMessage });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ error: unauthorizedMessage, message: unauthorizedMessage });
        }

        if (user.isSuspended) {
            return res.status(403).json({
                error: 'Your account has been suspended by admin.',
                message: 'Your account has been suspended by admin.'
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: unauthorizedMessage, message: unauthorizedMessage });
    }
};

module.exports = { protect };
