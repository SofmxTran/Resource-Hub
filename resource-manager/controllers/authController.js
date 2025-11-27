const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

function renderRegister(req, res) {
  res.render('auth/register', { 
    title: 'Create Account',
    activeNav: null,
  });
}

function sanitizeUsername(username) {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

async function register(req, res) {
  const fullName = (req.body.fullName || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const rawUsername = (req.body.username || '').trim();
  const username = sanitizeUsername(rawUsername);
  const password = req.body.password || '';

  if (!fullName || !email || !username || !password) {
    req.session.error = 'Full name, email, username, and password are required.';
    return res.redirect('/register');
  }

  if (username.length < 3) {
    req.session.error = 'Username must be at least 3 characters.';
    return res.redirect('/register');
  }

  const existingEmail = await userModel.findByEmail(email);
  if (existingEmail) {
    req.session.error = 'Email already registered.';
    return res.redirect('/register');
  }

  const existingUsername = await userModel.findByUsername(username);
  if (existingUsername) {
    req.session.error = 'Username already taken.';
    return res.redirect('/register');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.createUser({
    fullName,
    email,
    passwordHash,
    username,
    isAdmin: 0,
  });

  req.session.user = buildSessionUser(user);
  req.session.success = 'Welcome! Account created.';
  return res.redirect('/dashboard');
}

function renderLogin(req, res) {
  res.render('auth/login', { 
    title: 'Login',
    activeNav: null,
  });
}

async function login(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !password) {
    req.session.error = 'Email and password required.';
    return res.redirect('/login');
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    req.session.error = 'Invalid credentials.';
    return res.redirect('/login');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    req.session.error = 'Invalid credentials.';
    return res.redirect('/login');
  }

  req.session.user = buildSessionUser(user);
  req.session.success = 'Logged in successfully.';
  return res.redirect('/dashboard');
}

function buildSessionUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    username: user.username,
    isAdmin: !!user.is_admin,
  };
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}

module.exports = {
  renderRegister,
  register,
  renderLogin,
  login,
  logout,
};

