const db = require('../db/database');

function getCommentsForResource(resourceId) {
  const stmt = db.prepare(
    `SELECT c.*, u.username, u.full_name
     FROM comments c
     INNER JOIN users u ON c.user_id = u.id
     WHERE c.resource_id = ?
     ORDER BY c.created_at DESC`
  );
  return stmt.all(resourceId);
}

function createComment({ resourceId, userId, content, rating }) {
  const stmt = db.prepare(
    `INSERT INTO comments (resource_id, user_id, content, rating)
     VALUES (?, ?, ?, ?)`
  );
  return stmt.run(resourceId, userId, content, rating || null);
}

function deleteComment(id, resourceId, userId, isAdmin = false) {
  const stmt = isAdmin
    ? db.prepare(`DELETE FROM comments WHERE id = ? AND resource_id = ?`)
    : db.prepare(`DELETE FROM comments WHERE id = ? AND resource_id = ? AND user_id = ?`);
  return isAdmin ? stmt.run(id, resourceId) : stmt.run(id, resourceId, userId);
}

module.exports = {
  getCommentsForResource,
  createComment,
  deleteComment,
};

