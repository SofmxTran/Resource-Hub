const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Download database from Render deployment
 * Usage: node scripts/download-db-from-render.js <render-url> [output-path]
 * Example: node scripts/download-db-from-render.js https://webhub.onrender.com ./backups/render-backup.db
 * 
 * Note: This requires your Render service to expose the database file via a route
 * or you need to use Render Shell to download it manually.
 */

function downloadDatabase(renderUrl, outputPath) {
  // This is a placeholder - you'll need to create an endpoint on your Render service
  // to serve the database file, or use Render Shell to download it
  
  console.log('⚠️  This script is a template.');
  console.log('📝 To download database from Render, you have two options:\n');
  
  console.log('Option 1: Use Render Shell (Recommended)');
  console.log('1. Go to Render Dashboard → Your Service → Shell');
  console.log('2. Run:');
  console.log('   cd /opt/render/project/src');
  console.log('   npm run backup-db');
  console.log('   # Then download the backup file via Render Dashboard → Shell → Download\n');
  
  console.log('Option 2: Create a download endpoint (Not recommended for production)');
  console.log('Add a route in your server.js:');
  console.log(`
app.get('/admin/download-db', ensureAuthenticated, (req, res) => {
  if (!req.session.user.isAdmin) {
    return res.status(403).send('Forbidden');
  }
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'db', 'resource-manager.db');
  res.download(dbPath, 'resource-manager.db');
});
  `);
  console.log('\nThen download:');
  console.log(`   ${renderUrl}/admin/download-db`);
  console.log('\n⚠️  Remember to remove this endpoint after downloading for security!');
}

const renderUrl = process.argv[2];
const outputPath = process.argv[3] || path.join(__dirname, '..', 'backups', `render-backup-${Date.now()}.db`);

if (!renderUrl) {
  console.log('Usage: node scripts/download-db-from-render.js <render-url> [output-path]');
  console.log('Example: node scripts/download-db-from-render.js https://webhub.onrender.com');
  process.exit(1);
}

downloadDatabase(renderUrl, outputPath);

