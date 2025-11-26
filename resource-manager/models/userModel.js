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

module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  findById,
  getUserCount,
};

