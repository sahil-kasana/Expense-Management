const jwt = require('jsonwebtoken');
const { error } = require('../utils/responseHelper');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return error(res, 'Authentication failed. Token missing.', 401);
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key');
        req.userData = { userId: decodedToken.userId, email: decodedToken.email };
        next();
    } catch (err) {
        return error(res, 'Authentication failed. Invalid token.', 401);
    }
};
