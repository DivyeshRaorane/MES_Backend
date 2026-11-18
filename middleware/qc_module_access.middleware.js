import pool from "../db/postgres.js";

// Departments that give access to the Quality (QC) module.
// Same rule as the client sidebar: 'Quality Control' and 'All' show the Quality menu.
const QC_DEPARTMENTS = ["Quality Control", "All"];

/**
 * Allows admins, and any user whose (enabled) departments include the QC module.
 * Use AFTER the global JWT check so req.user is populated.
 * Department is read from the database on every call, so access changes apply immediately.
 */
export const requireQcModuleAccess = async (req, res, next) => {
  try {
    const role = String(req.user?.role || "").toLowerCase();
    if (role === "admin") return next();

    const empId = req.user?.emp_id;
    if (!empId) return res.status(403).json({ status: 403, message: "Forbidden: no user on token", data: null });

    const r = await pool.query(
      `SELECT 1
         FROM user_departments ud
         JOIN departments d ON d.id = ud.department_id
        WHERE ud.emp_id = $1
          AND d.d_name = ANY($2::text[])
          AND COALESCE(d.disable, FALSE) = FALSE
        LIMIT 1`,
      [String(empId), QC_DEPARTMENTS]
    );
    if (r.rows.length === 0) {
      return res.status(403).json({ status: 403, message: "Forbidden: QC module access required", data: null });
    }
    return next();
  } catch (error) {
    console.error("QC module access check error:", error.message);
    return res.status(500).json({ status: 500, message: "Something went wrong", data: null });
  }
};
