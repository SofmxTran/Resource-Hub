const db = require('../db/database');

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

  if (filters.q) {
    clauses.push('(r.title LIKE ? OR r.description LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, params };
}

function getAllResources(userId, filters = {}) {
  const { where, params } = buildFilters(userId, filters);
  const query = `
    SELECT r.*, d.name AS domain_name
    FROM resources r
    LEFT JOIN domains d ON r.domain_id = d.id
    ${where}
    ORDER BY r.created_at DESC
  `;
  return db.prepare(query).all(...params);
}

function getResourceById(id, userId) {
  const stmt = db.prepare(
    `SELECT r.*, d.name AS domain_name
     FROM resources r
     LEFT JOIN domains d ON r.domain_id = d.id
     WHERE r.id = ? AND r.user_id = ?`
  );
  return stmt.get(id, userId);
}

function createResource({
  userId,
  domainId,
  title,
  description,
  type,
  filePath,
  url,
  purpose,
}) {
  const stmt = db.prepare(
    `INSERT INTO resources 
    (user_id, domain_id, title, description, type, file_path, url, purpose)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    userId,
    domainId || null,
    title,
    description,
    type,
    filePath || null,
    url || null,
    purpose || null
  );
  return result.lastInsertRowid;
}

function updateResource(
  id,
  userId,
  { domainId, title, description, type, filePath, url, purpose }
) {
  const stmt = db.prepare(
    `UPDATE resources
     SET domain_id = ?, title = ?, description = ?, type = ?, file_path = ?, url = ?, purpose = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`
  );
  return stmt.run(
    domainId || null,
    title,
    description,
    type,
    filePath || null,
    url || null,
    purpose || null,
    id,
    userId
  );
}

function deleteResource(id, userId) {
  const stmt = db.prepare(`DELETE FROM resources WHERE id = ? AND user_id = ?`);
  return stmt.run(id, userId);
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

module.exports = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  toggleFavorite,
  getResourceCount,
  getDomainBreakdown,
  getRecentResources,
  getFavoriteResources,
};

