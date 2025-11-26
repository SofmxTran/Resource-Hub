const path = require('path');
const Database = require('better-sqlite3');

const dbPath =
  process.env.DATABASE_PATH || path.join(__dirname, 'resource-manager.db');

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function columnInfo(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

function columnExists(table, column) {
  return columnInfo(table).some((col) => col.name === column);
}

function ensureUsernameColumn() {
  const hasColumn = columnExists('users', 'username');
  if (!hasColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT`);
  }

  const users = db
    .prepare(
      `SELECT id, email, full_name FROM users WHERE username IS NULL OR username = '' ORDER BY id ASC`
    )
    .all();

  if (!users.length) {
    db.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`
    );
    return;
  }

  const update = db.prepare(`UPDATE users SET username = ? WHERE id = ?`);
  const taken = new Set(
    db
      .prepare(
        `SELECT LOWER(username) AS username FROM users WHERE username IS NOT NULL AND username <> ''`
      )
      .all()
      .map((row) => row.username)
  );

  const makeSlug = (value, fallback) => {
    const baseCandidate =
      (value || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || fallback;
    let unique = baseCandidate;
    let counter = 1;
    while (taken.has(unique)) {
      unique = `${baseCandidate}${counter}`;
      counter += 1;
    }
    taken.add(unique.toLowerCase());
    return unique;
  };

  users.forEach((user) => {
    const emailSlug = user.email ? user.email.split('@')[0] : '';
    const fallback = `user${user.id}`;
    const slug = makeSlug(emailSlug, fallback);
    update.run(slug, user.id);
  });

  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`
  );
}

function ensureAdminFlag() {
  if (!columnExists('users', 'is_admin')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
  }
}

function ensureResourceVisibilityFlag() {
  if (!columnExists('resources', 'is_public')) {
    db.exec(`ALTER TABLE resources ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1`);
    db.exec(`UPDATE resources SET is_public = 1 WHERE is_public IS NULL`);
  }
}

function ensureResourceEnhancements() {
  if (!columnExists('resources', 'image_path')) {
    db.exec(`ALTER TABLE resources ADD COLUMN image_path TEXT`);
  }
  if (!columnExists('resources', 'guide_text')) {
    db.exec(`ALTER TABLE resources ADD COLUMN guide_text TEXT`);
  }
  if (!columnExists('resources', 'status')) {
    db.exec(
      `ALTER TABLE resources ADD COLUMN status TEXT NOT NULL DEFAULT 'APPROVED'`
    );
    db.exec(`UPDATE resources SET status = 'APPROVED' WHERE status IS NULL`);
  }
}

function ensureCommentsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function ensureVotesTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resource_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      value INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(resource_id, user_id)
    );
  `);
}

const init = () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      domain_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK (type IN ('FILE','LINK')),
      file_path TEXT,
      image_path TEXT,
      url TEXT,
      purpose TEXT,
      guide_text TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_public INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
    );
  `;

  db.exec(schema);
  ensureUsernameColumn();
  ensureAdminFlag();
  ensureResourceVisibilityFlag();
  ensureResourceEnhancements();
  ensureCommentsTable();
  ensureVotesTable();
};

init();

module.exports = db;

