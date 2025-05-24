const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token kerak.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET); // { uid, isAdmin }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Yaroqsiz token.' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Faqat adminlar kirishi mumkin.' });
    }
    next();
}

module.exports = { authenticate, requireAdmin };
