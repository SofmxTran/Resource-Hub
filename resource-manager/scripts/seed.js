const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('../db/database');

function seed() {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleFile = path.join(uploadDir, 'SampleNotes.txt');
  if (!fs.existsSync(sampleFile)) {
    fs.writeFileSync(
      sampleFile,
      'Sample notes for the Resource Manager project. Replace with your own files!'
    );
  }

  const userEmail = 'student@example.com';
  const existingUser = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(userEmail);

  let userId = existingUser ? existingUser.id : null;

  if (!existingUser) {
    const hash = bcrypt.hashSync('password123', 10);
    const insert = db.prepare(
      `INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)`
    );
    const result = insert.run('Sample Student', userEmail, hash);
    userId = result.lastInsertRowid;
    console.log('Created sample user: student@example.com / password123');
  }

  const domainNames = [
    { name: 'Programming', description: 'Code, snippets, and docs' },
    { name: 'Video Editing', description: 'Tutorials and reference files' },
    { name: 'Design', description: 'UI inspiration and assets' },
  ];

  domainNames.forEach((domain) => {
    const exists = db
      .prepare('SELECT * FROM domains WHERE name = ?')
      .get(domain.name);
    if (!exists) {
      db.prepare('INSERT INTO domains (name, description) VALUES (?, ?)').run(
        domain.name,
        domain.description
      );
    }
  });

  const domains = db.prepare('SELECT * FROM domains').all();
  const programmingDomain = domains.find((d) => d.name === 'Programming');
  const videoDomain = domains.find((d) => d.name === 'Video Editing');

  const existingResources = db
    .prepare('SELECT COUNT(*) as total FROM resources WHERE user_id = ?')
    .get(userId).total;

  if (existingResources === 0) {
    db.prepare(
      `INSERT INTO resources 
      (user_id, domain_id, title, description, type, file_path, url, purpose, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      programmingDomain ? programmingDomain.id : null,
      'Java Basics Notes',
      'Lecture slides and summary for Intro to Java.',
      'FILE',
      path.basename(sampleFile),
      null,
      'Study',
      1
    );

    db.prepare(
      `INSERT INTO resources 
      (user_id, domain_id, title, description, type, file_path, url, purpose, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      videoDomain ? videoDomain.id : null,
      'Premiere Pro Tutorial',
      'YouTube playlist for fast color grading tips.',
      'LINK',
      null,
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'Video Editing',
      0
    );
    console.log('Inserted sample resources.');
  }

  console.log('Seeding complete.');
}

seed();

