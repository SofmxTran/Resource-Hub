const db = require('../db/database');

function getVote(resourceId, userId) {
  const stmt = db.prepare(
    `SELECT * FROM resource_votes WHERE resource_id = ? AND user_id = ?`
  );
  return stmt.get(resourceId, userId);
}

function addVote(resourceId, userId) {
  const stmt = db.prepare(
    `INSERT INTO resource_votes (resource_id, user_id, value)
     VALUES (?, ?, 1)`
  );
  return stmt.run(resourceId, userId);
}

function removeVote(resourceId, userId) {
  const stmt = db.prepare(
    `DELETE FROM resource_votes WHERE resource_id = ? AND user_id = ?`
  );
  return stmt.run(resourceId, userId);
}

module.exports = {
  getVote,
  addVote,
  removeVote,
};

