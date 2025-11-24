const db = require('../db/database');

function createUser({ fullName, email, passwordHash }) {
  const stmt = db.prepare(
    `INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)`
  );
  const result = stmt.run(fullName, email, passwordHash);
  return { id: result.lastInsertRowid, full_name: fullName, email };
}

function findByEmail(email) {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
  return stmt.get(email);
}

function findById(id) {
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  return stmt.get(id);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
};

