const db = require('../db/database');

function createUser({ fullName, email, passwordHash, username, isAdmin = 0 }) {
  const stmt = db.prepare(
    `INSERT INTO users (full_name, email, password_hash, username, is_admin)
     VALUES (?, ?, ?, ?, ?)`
  );
  const result = stmt.run(fullName, email, passwordHash, username, isAdmin ? 1 : 0);
  return {
    id: result.lastInsertRowid,
    full_name: fullName,
    email,
    username,
    is_admin: isAdmin ? 1 : 0,
  };
}

function findByEmail(email) {
  const stmt = db.prepare(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`);
  return stmt.get(email);
}

function findByUsername(username) {
  const stmt = db.prepare(
    `SELECT * FROM users WHERE LOWER(username) = LOWER(?)`
  );
  return stmt.get(username);
}

function findById(id) {
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  return stmt.get(id);
}

function getUserCount() {
  const stmt = db.prepare(`SELECT COUNT(*) AS total FROM users`);
  return stmt.get().total;
}

function updateProfile(userId, { displayName, bio, website, avatarPath }) {
  const updates = [];
  const params = [];
  
  if (displayName !== undefined) {
    updates.push('display_name = ?');
    params.push(displayName || null);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio || null);
  }
  if (website !== undefined) {
    updates.push('website = ?');
    params.push(website || null);
  }
  if (avatarPath !== undefined) {
    updates.push('avatar_path = ?');
    params.push(avatarPath || null);
  }
  
  if (updates.length === 0) {
    return { changes: 0 };
  }
  
  params.push(userId);
  const stmt = db.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  );
  return stmt.run(...params);
}

function getLeaderboard(limit = 20) {
  const query = `
    SELECT 
      u.id,
      u.username,
      u.display_name,
      u.full_name,
      u.avatar_path,
      u.bio,
      COUNT(DISTINCT r.id) AS resource_count,
      COUNT(DISTINCT CASE WHEN r.is_public = 1 AND r.status = 'APPROVED' THEN r.id END) AS public_resource_count,
      COALESCE(SUM(DISTINCT v.trust_score), 0) AS trust_score_sum,
      COUNT(DISTINCT c.id) AS comment_count,
      COUNT(DISTINCT CASE WHEN c.user_id = u.id THEN c.id END) AS comments_given
    FROM users u
    LEFT JOIN resources r ON r.user_id = u.id
    LEFT JOIN (
      SELECT resource_id, COALESCE(SUM(value), 0) AS trust_score
      FROM resource_votes
      GROUP BY resource_id
    ) v ON v.resource_id = r.id
    LEFT JOIN comments c ON c.resource_id = r.id
    GROUP BY u.id
    ORDER BY 
      (public_resource_count * 3 + resource_count * 1 + trust_score_sum * 2) DESC,
      u.created_at ASC
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

function getUserStats(userId) {
  const resourceStats = db.prepare(`
    SELECT 
      COUNT(*) AS total_resources,
      COUNT(CASE WHEN is_public = 1 AND status = 'APPROVED' THEN 1 END) AS public_resources,
      COALESCE(SUM(v.trust_score), 0) AS total_trust_score
    FROM resources r
    LEFT JOIN (
      SELECT resource_id, COALESCE(SUM(value), 0) AS trust_score
      FROM resource_votes
      GROUP BY resource_id
    ) v ON v.resource_id = r.id
    WHERE r.user_id = ?
  `).get(userId);
  
  const commentStats = db.prepare(`
    SELECT 
      COUNT(DISTINCT CASE WHEN c.resource_id IN (SELECT id FROM resources WHERE user_id = ?) THEN c.id END) AS comments_received,
      COUNT(DISTINCT CASE WHEN c.user_id = ? THEN c.id END) AS comments_given
    FROM comments c
  `).get(userId, userId);
  
  return {
    totalResources: resourceStats.total_resources || 0,
    publicResources: resourceStats.public_resources || 0,
    totalTrustScore: resourceStats.total_trust_score || 0,
    commentsReceived: commentStats.comments_received || 0,
    commentsGiven: commentStats.comments_given || 0,
  };
}

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  getUserCount,
  updateProfile,
  getLeaderboard,
  getUserStats,
};

