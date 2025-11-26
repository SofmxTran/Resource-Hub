const fs = require('fs');
const path = require('path');

/**
 * Backup database file
 * Usage: node scripts/backup-db.js
 */
function backupDatabase() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'resource-manager.db');
  const backupDir = path.join(__dirname, '..', 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFileName = `resource-manager-${timestamp}.db`;
  const backupPath = path.join(backupDir, backupFileName);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Check if database exists
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    process.exit(1);
  }

  // Copy database file
  try {
    fs.copyFileSync(dbPath, backupPath);
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Database backup created successfully!');
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 File size: ${fileSizeInMB} MB`);
    console.log(`\n💡 To restore this backup, copy it to your deployment and set DATABASE_PATH environment variable.`);
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    process.exit(1);
  }
}

backupDatabase();

