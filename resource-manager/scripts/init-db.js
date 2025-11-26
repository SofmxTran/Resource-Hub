const fs = require('fs');
const path = require('path');

/**
 * Auto-restore database from backup when deploying
 * This script runs automatically after npm install or before server start
 * Usage: node scripts/init-db.js
 */
function initDatabase() {
  // Tìm file backup mới nhất
  const backupsDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    console.log('ℹ️  No backups directory found, skipping database restore.');
    return;
  }

  const backupFiles = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(backupsDir, f),
      time: fs.statSync(path.join(backupsDir, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  if (backupFiles.length === 0) {
    console.log('ℹ️  No backup files found, skipping database restore.');
    return;
  }

  const latestBackup = backupFiles[0];
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'resource-manager.db');
  const dbDir = path.dirname(dbPath);

  // Tạo thư mục db nếu chưa có
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created database directory: ${dbDir}`);
  }

  // Chỉ restore nếu database chưa tồn tại
  if (!fs.existsSync(dbPath)) {
    console.log(`📦 Restoring database from ${latestBackup.name}...`);
    try {
      fs.copyFileSync(latestBackup.path, dbPath);
      const stats = fs.statSync(dbPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Database restored successfully! (${fileSizeInMB} MB)`);
    } catch (error) {
      console.error('❌ Error restoring database:', error.message);
      process.exit(1);
    }
  } else {
    console.log('ℹ️  Database already exists, skipping restore.');
  }
}

initDatabase();

