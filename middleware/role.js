// middleware/role.js
module.exports = function (allowedRoles = []) {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(403).json({ error: 'Unauthorized. No user found in request.' });
        }

        const role = user.role || (user.user_id ? 'user' : 'business');

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }

        next();
    };
};
