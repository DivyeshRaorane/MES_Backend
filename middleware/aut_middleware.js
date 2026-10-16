import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // 👈 contains userId

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Role-based access guard. Use AFTER authMiddleware so req.user is populated.
 *
 * Usage:
 *   router.get("/path", authMiddleware, requireRole("admin"), handler);
 *   router.get("/path", authMiddleware, requireRole("admin", "superadmin"), handler);
 *
 * Returns 403 when the authenticated user's role is not in the allowed list.
 */
export const requireRole = (...allowedRoles) => {
  const allowed = allowedRoles.map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(403).json({ message: "Forbidden: no role on token" });
    }

    if (!allowed.includes(String(role).toLowerCase())) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
};
