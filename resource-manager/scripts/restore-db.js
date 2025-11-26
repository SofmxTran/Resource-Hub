const fs = require('fs');
const path = require('path');

/**
 * Restore database from backup
 * Usage: node scripts/restore-db.js <backup-file-path>
 * Example: node scripts/restore-db.js backups/resource-manager-2025-01-15T10-30-00.db
 */
function restoreDatabase() {
  const backupPath = process.argv[2];
  
  if (!backupPath) {
    console.error('❌ Please provide backup file path');
    console.log('Usage: node scripts/restore-db.js <backup-file-path>');
    console.log('Example: node scripts/restore-db.js backups/resource-manager-2025-01-15T10-30-00.db');
    process.exit(1);
  }

  const fullBackupPath = path.isAbsolute(backupPath) 
    ? backupPath 
    : path.join(__dirname, '..', backupPath);

  if (!fs.existsSync(fullBackupPath)) {
    console.error(`❌ Backup file not found: ${fullBackupPath}`);
    process.exit(1);
  }

  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'db', 'resource-manager.db');
  const dbDir = path.dirname(dbPath);

  // Create db directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Backup existing database if it exists
  if (fs.existsSync(dbPath)) {
    const existingBackup = `${dbPath}.old-${Date.now()}`;
    fs.copyFileSync(dbPath, existingBackup);
    console.log(`📦 Existing database backed up to: ${existingBackup}`);
  }

  // Restore from backup
  try {
    fs.copyFileSync(fullBackupPath, dbPath);
    const stats = fs.statSync(dbPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Database restored successfully!');
    console.log(`📁 Database location: ${dbPath}`);
    console.log(`📊 File size: ${fileSizeInMB} MB`);
    console.log(`\n💡 Restart your application to use the restored database.`);
  } catch (error) {
    console.error('❌ Error restoring database:', error.message);
    process.exit(1);
  }
}

restoreDatabase();

