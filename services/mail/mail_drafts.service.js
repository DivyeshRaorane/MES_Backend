import pool from "../../db/postgres.js";

/**
 * Save a new mail draft
 */
export const createDraftS = async (data) => {
  const { draftName, provider, to, cc, bcc, subject, text, html, templateName, templateVars, createdBy } = data;

  const query = `
    INSERT INTO mail_drafts 
      (draft_name, provider, "to", cc, bcc, subject, text, html, template_name, template_vars, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    draftName,
    provider,
    to,
    cc || null,
    bcc || null,
    subject,
    text || null,
    html || null,
    templateName || null,
    templateVars ? JSON.stringify(templateVars) : null,
    createdBy || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get all drafts (for current user or all if admin)
 */
export const getDraftsS = async (userId, isAdmin = false) => {
  let query;
  let values;

  if (isAdmin) {
    query = `SELECT * FROM mail_drafts ORDER BY updated_at DESC`;
    values = [];
  } else {
    query = `SELECT * FROM mail_drafts WHERE created_by = $1 ORDER BY updated_at DESC`;
    values = [userId];
  }

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Update a draft by id
 */
export const updateDraftS = async (id, data, userId) => {
  // Check if draft exists
  const checkResult = await pool.query(`SELECT id, created_by FROM mail_drafts WHERE id = $1`, [id]);

  if (checkResult.rows.length === 0) {
    throw new Error("Draft not found");
  }

  const { draftName, provider, to, cc, bcc, subject, text, html, templateName, templateVars } = data;

  const query = `
    UPDATE mail_drafts SET
      draft_name = $1,
      provider = $2,
      "to" = $3,
      cc = $4,
      bcc = $5,
      subject = $6,
      text = $7,
      html = $8,
      template_name = $9,
      template_vars = $10,
      updated_at = NOW()
    WHERE id = $11
    RETURNING *
  `;

  const values = [
    draftName,
    provider,
    to,
    cc || null,
    bcc || null,
    subject,
    text || null,
    html || null,
    templateName || null,
    templateVars ? JSON.stringify(templateVars) : null,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Delete a draft by id
 */
export const deleteDraftS = async (id, userId) => {
  const checkResult = await pool.query(`SELECT id, created_by FROM mail_drafts WHERE id = $1`, [id]);

  if (checkResult.rows.length === 0) {
    throw new Error("Draft not found");
  }

  await pool.query(`DELETE FROM mail_drafts WHERE id = $1`, [id]);
  return { id, deleted: true };
};
