const mongoose = require('mongoose');
require('dotenv').config();

// Get MONGODB_URI from environment
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webhub_dev';

// Ensure database name is specified in the connection string
function ensureDatabaseName(uri) {
  if (!uri) {
    console.error('❌ MONGODB_URI is not set!');
    return uri;
  }

  // Default database name
  const DEFAULT_DB_NAME = 'webhub';
  
  try {
    // For mongodb+srv:// connections (MongoDB Atlas)
    if (uri.includes('mongodb+srv://')) {
      // Check if database name is already in the path
      // Format: mongodb+srv://user:pass@cluster.mongodb.net/dbname?options
      const pathMatch = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/);
      const queryMatch = uri.match(/\?/);
      
      if (!pathMatch || pathMatch[1] === '') {
        // No database name in path, add it
        if (queryMatch) {
          // Has query params, insert database name before ?
          uri = uri.replace(/\?/, `/${DEFAULT_DB_NAME}?`);
          console.log(`⚠️  No database name in MONGODB_URI, added "${DEFAULT_DB_NAME}"`);
        } else {
          // No query params, append database name
          uri = uri.endsWith('/') ? `${uri}${DEFAULT_DB_NAME}` : `${uri}/${DEFAULT_DB_NAME}`;
          console.log(`⚠️  No database name in MONGODB_URI, added "${DEFAULT_DB_NAME}"`);
        }
      } else {
        // Database name exists, check if it's empty or just whitespace
        // Also handle trailing slash like: /webhub/?appName=...
        let dbName = pathMatch[1].trim();
        // Remove trailing slash if present
        dbName = dbName.replace(/\/$/, '');
        
        if (dbName === '' || dbName === '/') {
          // Empty database name, replace it
          uri = uri.replace(/\/[^?]*(\?|$)/, `/${DEFAULT_DB_NAME}$1`);
          console.log(`⚠️  Empty database name in MONGODB_URI, using "${DEFAULT_DB_NAME}"`);
        } else if (dbName !== pathMatch[1]) {
          // Had trailing slash, normalize it (remove the extra /)
          uri = uri.replace(/\/webhub\/\?/, '/webhub?');
          console.log(`ℹ️  Normalized MONGODB_URI (removed trailing slash after database name)`);
        }
      }
    } else {
      // For standard mongodb:// connections
      // Format: mongodb://host:port/dbname?options
      const pathMatch = uri.match(/mongodb:\/\/[^/]+\/([^?]+)/);
      const queryMatch = uri.match(/\?/);
      
      if (!pathMatch || pathMatch[1] === '') {
        // No database name in path, add it
        if (queryMatch) {
          // Has query params, insert database name before ?
          uri = uri.replace(/\?/, `/${DEFAULT_DB_NAME}?`);
          console.log(`⚠️  No database name in MONGODB_URI, added "${DEFAULT_DB_NAME}"`);
        } else {
          // No query params, append database name
          uri = uri.endsWith('/') ? `${uri}${DEFAULT_DB_NAME}` : `${uri}/${DEFAULT_DB_NAME}`;
          console.log(`⚠️  No database name in MONGODB_URI, added "${DEFAULT_DB_NAME}"`);
        }
      } else {
        // Database name exists, check if it's empty
        const dbName = pathMatch[1].trim();
        if (dbName === '' || dbName === '/') {
          // Empty database name, replace it
          uri = uri.replace(/\/[^?]*(\?|$)/, `/${DEFAULT_DB_NAME}$1`);
          console.log(`⚠️  Empty database name in MONGODB_URI, using "${DEFAULT_DB_NAME}"`);
        }
      }
    }
    
    return uri;
  } catch (err) {
    console.error('❌ Error parsing MONGODB_URI:', err.message);
    console.error('   Original URI (password hidden):', uri.replace(/:[^:@]+@/, ':****@'));
    // Try manual fix as fallback
    if (uri.includes('mongodb+srv://')) {
      if (!uri.match(/\/[^/?]+(\?|$)/)) {
        const dbName = DEFAULT_DB_NAME;
        if (uri.includes('?')) {
          uri = uri.replace('?', `/${dbName}?`);
        } else {
          uri = uri.endsWith('/') ? `${uri}${dbName}` : `${uri}/${dbName}`;
        }
        console.log(`⚠️  Manual fix applied, using database: "${dbName}"`);
      }
    }
    return uri;
  }
}

// Ensure database name is set
MONGODB_URI = ensureDatabaseName(MONGODB_URI);

// Extract and log database name for debugging
function getDatabaseName(uri) {
  if (!uri) return 'undefined';
  
  try {
    // Try regex extraction first (works for both mongodb:// and mongodb+srv://)
    // Handle cases like: /webhub? or /webhub/? (with trailing slash)
    const match = uri.match(/\/([^/?]+)\/?(\?|$)/);
    if (match && match[1] && match[1].trim() !== '') {
      return match[1].trim(); // Trim any whitespace
    }
    
    // Fallback: try URL parsing
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(p => p);
    if (pathParts.length > 0 && pathParts[0].trim() !== '') {
      return pathParts[0].trim();
    }
    
    // Check query params
    const dbFromQuery = url.searchParams.get('db') || url.searchParams.get('database');
    if (dbFromQuery) {
      return dbFromQuery.trim();
    }
    
    return 'NOT SPECIFIED (will use "test" by default)';
  } catch (err) {
    // Try regex extraction as fallback
    const match = uri.match(/\/([^/?]+)\/?(\?|$)/);
    return match && match[1] ? match[1].trim() : 'NOT SPECIFIED (will use "test" by default)';
  }
}

const dbName = getDatabaseName(MONGODB_URI);
console.log(`📊 Connecting to MongoDB database: "${dbName}"`);

async function connectDB() {
  try {
    // Log the URI (with password hidden) and database name before connecting
    const uriForLog = MONGODB_URI.replace(/:[^:@]+@/, ':****@');
    const dbNameFromUri = getDatabaseName(MONGODB_URI);
    console.log(`📊 Attempting to connect to MongoDB...`);
    console.log(`   URI (password hidden): ${uriForLog}`);
    console.log(`   Database name from URI: "${dbNameFromUri}"`);
    
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 8 has sane defaults, minimal options needed
    });
    
    // Log the actual database name being used
    const actualDbName = mongoose.connection.db.databaseName;
    console.log(`✅ MongoDB connected successfully to database: "${actualDbName}"`);
    
    if (actualDbName === 'test') {
      console.error('');
      console.error('❌ ERROR: Connected to "test" database instead of your specified database!');
      console.error('   This usually means MONGODB_URI does not include a database name.');
      console.error('');
      console.error('   To fix this:');
      console.error('   1. Check your MONGODB_URI environment variable on Render');
      console.error('   2. Make sure it includes the database name, e.g.:');
      console.error('      mongodb+srv://user:pass@cluster.mongodb.net/webhub?retryWrites=true&w=majority');
      console.error('                                                          ^^^^^^');
      console.error('                                                          database name here');
      console.error('');
      console.error('   3. Update MONGODB_URI in Render dashboard:');
      console.error('      - Go to your service → Environment');
      console.error('      - Edit MONGODB_URI to include database name');
      console.error('      - Redeploy your service');
      console.error('');
    } else if (dbNameFromUri === 'NOT SPECIFIED (will use "test" by default)') {
      console.warn(`⚠️  WARNING: Database name was not in URI, but connected to "${actualDbName}"`);
      console.warn('   This may be due to automatic database name addition.');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.error('   MONGODB_URI (password hidden):', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    console.error('   Make sure:');
    console.error('   1. MONGODB_URI is set correctly in your environment variables');
    console.error('   2. Database name is included in the connection string');
    console.error('   3. Your IP is whitelisted in MongoDB Atlas (if using Atlas)');
    process.exit(1);
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = { connectDB };

