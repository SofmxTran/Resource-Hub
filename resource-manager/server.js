const path = require('path');
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { connectDB } = require('./db/mongoose');

const authRoutes = require('./routes/authRoutes');
const pageRoutes = require('./routes/pageRoutes');
const domainRoutes = require('./routes/domainRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { ensureAuthenticated } = require('./middleware/authMiddleware');
const userModel = require('./models/userModel');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Note: File uploads are now handled by Cloudinary, so we don't need to serve local uploads
// The /uploads route is kept for backward compatibility with old local file paths
// but new uploads will be Cloudinary URLs

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'resource-secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(async (req, res, next) => {
  // Refresh user info from DB if session has user (to ensure isAdmin is up-to-date)
  if (req.session.user && req.session.user.id) {
    const dbUser = await userModel.findById(req.session.user.id);
    if (dbUser) {
      req.session.user = {
        id: dbUser.id,
        fullName: dbUser.full_name,
        email: dbUser.email,
        username: dbUser.username,
        isAdmin: !!dbUser.is_admin,
      };
    }
  }
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/domains', ensureAuthenticated, domainRoutes);
app.use('/resources', resourceRoutes);
app.use('/admin', adminRoutes);
app.use('/settings', settingsRoutes);

app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    activeNav: null,
  });
});

// Connect to MongoDB before starting server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Resource Manager running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

