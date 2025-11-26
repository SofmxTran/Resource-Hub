const db = require('../db/database');

const trustJoin = `
  LEFT JOIN (
    SELECT resource_id, COALESCE(SUM(value), 0) AS trust_score
    FROM resource_votes
    GROUP BY resource_id
  ) v ON v.resource_id = r.id
`;

function buildFilters(userId, filters = {}) {
  const clauses = ['r.user_id = ?'];
  const params = [userId];

  if (filters.domain && filters.domain !== 'all') {
    clauses.push('r.domain_id = ?');
    params.push(filters.domain);
  }

  if (filters.type && filters.type !== 'all') {
    clauses.push('r.type = ?');
    params.push(filters.type);
  }

  if (filters.purpose && filters.purpose !== 'all') {
    clauses.push('r.purpose = ?');
    params.push(filters.purpose);
  }

  if (filters.favorite === '1') {
    clauses.push('r.is_favorite = 1');
  }

  if (filters.status && filters.status !== 'ALL') {
    clauses.push('r.status = ?');
    params.push(filters.status);
  }

  if (filters.q) {
    clauses.push(
      "(LOWER(r.title) LIKE ? OR LOWER(COALESCE(r.description, '')) LIKE ?)"
    );
    params.push(`%${filters.q.toLowerCase()}%`, `%${filters.q.toLowerCase()}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, params };
}

function buildPublicFilters(filters = {}) {
  const clauses = ["r.is_public = 1", "r.status = 'APPROVED'"];
  const params = [];

  if (filters.domain && filters.domain !== 'all') {
    clauses.push('r.domain_id = ?');
    params.push(filters.domain);
  }

  if (filters.type && filters.type !== 'all') {
    clauses.push('r.type = ?');
    params.push(filters.type);
  }

  if (filters.purpose && filters.purpose !== 'all') {
    clauses.push('r.purpose = ?');
    params.push(filters.purpose);
  }

  if (filters.q) {
    clauses.push(
      "(LOWER(r.title) LIKE ? OR LOWER(COALESCE(r.description, '')) LIKE ?)"
    );
    params.push(`%${filters.q.toLowerCase()}%`, `%${filters.q.toLowerCase()}%`);
  }

  if (filters.username) {
    clauses.push('LOWER(u.username) = ?');
    params.push(filters.username.toLowerCase());
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, params };
}

function getAllResources(userId, filters = {}) {
  const { where, params } = buildFilters(userId, filters);
  const query = `
    SELECT r.*, d.name AS domain_name, COALESCE(v.trust_score, 0) AS trust_score
    FROM resources r
    LEFT JOIN domains d ON r.domain_id = d.id
    ${trustJoin}
    ${where}
    ORDER BY r.created_at DESC
  `;
  return db.prepare(query).all(...params);
}

function getResourceById(id, userId) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name, COALESCE(v.trust_score, 0) AS trust_score
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     ${trustJoin}
     WHERE r.id = ? AND r.user_id = ?`
  );
  return stmt.get(id, userId);
}

function getResourceForDetail(id) {
  const stmt = db.prepare(
    `SELECT r.*, 
            d.name AS domain_name,
            u.username,
            u.full_name,
            u.id AS owner_id,
            COALESCE(v.trust_score, 0) AS trust_score
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     INNER JOIN users u ON r.user_id = u.id
     ${trustJoin}
     WHERE r.id = ?`
  );
  return stmt.get(id);
}

function createResource({
  userId,
  domainId,
  title,
  description,
  type,
  filePath,
  imagePath,
  url,
  purpose,
  guideText,
  isPublic,
  status = 'PENDING',
}) {
  const stmt = db.prepare(
    `INSERT INTO resources 
    (user_id, domain_id, title, description, type, file_path, image_path, url, purpose, guide_text, is_public, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    userId,
    domainId || null,
    title,
    description,
    type,
    filePath || null,
    imagePath || null,
    url || null,
    purpose || null,
    guideText || null,
    isPublic ? 1 : 0,
    status
  );
  return result.lastInsertRowid;
}

function updateResource(
  id,
  userId,
  {
    domainId,
    title,
    description,
    type,
    filePath,
    imagePath,
    url,
    purpose,
    guideText,
    isPublic,
    status,
  }
) {
  const stmt = db.prepare(
    `UPDATE resources
     SET domain_id = ?, title = ?, description = ?, type = ?, file_path = ?, image_path = ?, url = ?, purpose = ?, guide_text = ?, is_public = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`
  );
  return stmt.run(
    domainId || null,
    title,
    description,
    type,
    filePath || null,
    imagePath || null,
    url || null,
    purpose || null,
    guideText || null,
    isPublic ? 1 : 0,
    status,
    id,
    userId
  );
}

function updateStatus(id, status) {
  const stmt = db.prepare(
    `UPDATE resources SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  return stmt.run(status, id);
}

function deleteResource(id, userId) {
  const stmt = db.prepare(`DELETE FROM resources WHERE id = ? AND user_id = ?`);
  return stmt.run(id, userId);
}

function deleteResourceByAdmin(id) {
  const stmt = db.prepare(`DELETE FROM resources WHERE id = ?`);
  return stmt.run(id);
}
function toggleFavorite(id, userId, isFavorite) {
  const stmt = db.prepare(
    `UPDATE resources SET is_favorite = ? WHERE id = ? AND user_id = ?`
  );
  return stmt.run(isFavorite ? 1 : 0, id, userId);
}

function getResourceCount(userId) {
  const stmt = db.prepare(
    `SELECT COUNT(*) AS total FROM resources WHERE user_id = ?`
  );
  return stmt.get(userId).total;
}

function getTotalResourceCount() {
  return db.prepare(`SELECT COUNT(*) AS total FROM resources`).get().total;
}

function getPendingResourceCount() {
  return db
    .prepare(
      `SELECT COUNT(*) AS total FROM resources WHERE status = 'PENDING' AND is_public = 1`
    )
    .get().total;
}

function getDomainBreakdown(userId) {
  const stmt = db.prepare(
    `SELECT COALESCE(d.name, 'Uncategorized') AS domain_name, COUNT(*) AS total
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     WHERE r.user_id = ?
     GROUP BY r.domain_id
     ORDER BY total DESC`
  );
  return stmt.all(userId);
}

function getRecentResources(userId, limit = 5) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT ?`
  );
  return stmt.all(userId, limit);
}

function getFavoriteResources(userId, limit = 5) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     WHERE r.user_id = ? AND r.is_favorite = 1
     ORDER BY r.updated_at DESC
     LIMIT ?`
  );
  return stmt.all(userId, limit);
}

function getPublicResources(filters = {}, limit = 20) {
  const { where, params } = buildPublicFilters(filters);
  const query = `
    SELECT r.*, d.name AS domain_name, u.username, u.full_name, COALESCE(v.trust_score, 0) AS trust_score
    FROM resources r
    INNER JOIN users u ON r.user_id = u.id
    LEFT JOIN domains d ON r.domain_id = d.id
    ${trustJoin}
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ?
  `;
  return db.prepare(query).all(...params, limit);
}

function getResourcesForUser(userId) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name, COALESCE(v.trust_score, 0) AS trust_score
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     ${trustJoin}
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`
  );
  return stmt.all(userId);
}

function getPublicResourcesByUser(userId) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name, COALESCE(v.trust_score, 0) AS trust_score
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     ${trustJoin}
     WHERE r.user_id = ? AND r.is_public = 1 AND r.status = 'APPROVED'
     ORDER BY r.created_at DESC`
  );
  return stmt.all(userId);
}

function getUserVisibilityStats(userId) {
  const stmt = db.prepare(
    `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AS publicCount,
        SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) AS privateCount
     FROM resources
     WHERE user_id = ?`
  );
  const row = stmt.get(userId) || {
    total: 0,
    publicCount: 0,
    privateCount: 0,
  };
  return {
    total: row.total || 0,
    public: row.publicCount || 0,
    private: row.privateCount || 0,
  };
}

function getResourcesByStatus(status) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name, u.username, u.full_name, COALESCE(v.trust_score, 0) AS trust_score
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     INNER JOIN users u ON r.user_id = u.id
     ${trustJoin}
     WHERE r.status = ?
     ORDER BY r.created_at DESC`
  );
  return stmt.all(status);
}

function getAllResourcesForAdmin() {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name, u.username, u.full_name, COALESCE(v.trust_score, 0) AS trust_score
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     INNER JOIN users u ON r.user_id = u.id
     ${trustJoin}
     ORDER BY r.created_at DESC`
  );
  return stmt.all();
}
function getRecentPending(limit = 5) {
  const stmt = db.prepare(
    `SELECT r.*, u.username, u.full_name, d.name AS domain_name
     FROM resources r
     INNER JOIN users u ON r.user_id = u.id
     LEFT JOIN domains d ON r.domain_id = d.id
     WHERE r.status = 'PENDING' AND r.is_public = 1
     ORDER BY r.created_at ASC
     LIMIT ?`
  );
  return stmt.all(limit);
}

module.exports = {
  getAllResources,
  getResourceById,
  getResourceForDetail,
  createResource,
  updateResource,
  updateStatus,
  deleteResource,
  toggleFavorite,
  getResourceCount,
  getDomainBreakdown,
  getRecentResources,
  getFavoriteResources,
  getPublicResources,
  getResourcesForUser,
  getPublicResourcesByUser,
  getUserVisibilityStats,
  getTotalResourceCount,
  getPendingResourceCount,
  getResourcesByStatus,
  getRecentPending,
  getAllResourcesForAdmin,
  deleteResourceByAdmin,
};

