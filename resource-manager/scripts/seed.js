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
      `INSERT INTO users (full_name, email, password_hash, username, is_admin, display_name, bio) 
       VALUES (?, ?, ?, ?, 0, ?, ?)`
    );
    const result = insert.run('Sample Student', userEmail, hash, 'student', 'Demo User', 'A sample student account for testing the Resource Hub.');
    userId = result.lastInsertRowid;
    console.log('Created sample user: student@example.com / password123');
  } else {
    if (!existingUser.username) {
      db.prepare('UPDATE users SET username = ? WHERE id = ?').run('student', existingUser.id);
    }
    // Update display_name and bio if not set
    if (!existingUser.display_name) {
      db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Demo User', existingUser.id);
    }
    if (!existingUser.bio) {
      db.prepare('UPDATE users SET bio = ? WHERE id = ?').run('A sample student account for testing the Resource Hub.', existingUser.id);
    }
    userId = existingUser.id;
  }

  const adminEmail = 'admin@example.com';
  const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('Admin123', 10);
    db.prepare(
      `INSERT INTO users (full_name, email, password_hash, username, is_admin, display_name, bio)
       VALUES (?, ?, ?, ?, 1, ?, ?)`
    ).run('Site Admin', adminEmail, hash, 'admin', 'Admin', 'Site administrator for WebHub Resource Manager.');
    console.log('Created admin user: admin@example.com / Admin123');
  } else {
    if (!existingAdmin.is_admin) {
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existingAdmin.id);
      console.log('Updated existing admin@example.com to admin privileges.');
    }
    // Update display_name and bio if not set
    if (!existingAdmin.display_name) {
      db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Admin', existingAdmin.id);
    }
    if (!existingAdmin.bio) {
      db.prepare('UPDATE users SET bio = ? WHERE id = ?').run('Site administrator for WebHub Resource Manager.', existingAdmin.id);
    }
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
      (user_id, domain_id, title, description, type, file_path, image_path, url, purpose, guide_text, is_favorite, is_public, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      programmingDomain ? programmingDomain.id : null,
      'Java Basics Notes',
      'Lecture slides and summary for Intro to Java.',
      'FILE',
      path.basename(sampleFile),
      null,
      null,
      'Study',
      'Read through the PDF, then practice each exercise in your IDE.',
      1,
      1,
      'APPROVED'
    );

    db.prepare(
      `INSERT INTO resources 
      (user_id, domain_id, title, description, type, file_path, image_path, url, purpose, guide_text, is_favorite, is_public, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      videoDomain ? videoDomain.id : null,
      'Premiere Pro Tutorial',
      'YouTube playlist for fast color grading tips.',
      'LINK',
      null,
      null,
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'Video Editing',
      'Watch the first episode, practice with sample footage, then tweak color wheels.',
      0,
      1,
      'APPROVED'
    );
    console.log('Inserted sample resources.');
  }

  console.log('Seeding complete.');
}

seed();

