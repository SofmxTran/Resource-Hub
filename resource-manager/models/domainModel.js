const db = require('../db/database');

function getAllDomains() {
  const stmt = db.prepare(
    `SELECT d.*, 
            (SELECT COUNT(*) FROM resources r WHERE r.domain_id = d.id) AS resourceCount
     FROM domains d
     ORDER BY d.name`
  );
  return stmt.all();
}

function getDomainById(id) {
  const stmt = db.prepare(`SELECT * FROM domains WHERE id = ?`);
  return stmt.get(id);
}

function createDomain({ name, description }) {
  const stmt = db.prepare(
    `INSERT INTO domains (name, description) VALUES (?, ?)`
  );
  return stmt.run(name, description);
}

function updateDomain(id, { name, description }) {
  const stmt = db.prepare(
    `UPDATE domains SET name = ?, description = ? WHERE id = ?`
  );
  return stmt.run(name, description, id);
}

function deleteDomain(id) {
  const stmt = db.prepare(`DELETE FROM domains WHERE id = ?`);
  return stmt.run(id);
}

function domainHasResources(id) {
  const stmt = db.prepare(`SELECT COUNT(*) as total FROM resources WHERE domain_id = ?`);
  const { total } = stmt.get(id);
  return total > 0;
}

module.exports = {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  domainHasResources,
};

