/**
 * Auth middleware for route protection
 */

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const { role } = req.session.user;
    if (role !== 'admin' && role !== 'superAdmin') {
        return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
    next();
}

function requireSuperAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    if (req.session.user.role !== 'superAdmin') {
        return res.status(403).json({ error: 'Forbidden. Super Admin access required.' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin, requireSuperAdmin };
