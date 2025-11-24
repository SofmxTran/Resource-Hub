const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

function renderRegister(req, res) {
  res.render('auth/register', { title: 'Create Account' });
}

async function register(req, res) {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    req.session.error = 'All fields are required.';
    return res.redirect('/register');
  }

  const existing = userModel.findByEmail(email.toLowerCase());
  if (existing) {
    req.session.error = 'Email already registered.';
    return res.redirect('/register');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = userModel.createUser({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
  });

  req.session.user = { id: user.id, fullName: user.full_name, email: user.email };
  req.session.success = 'Welcome! Account created.';
  return res.redirect('/dashboard');
}

function renderLogin(req, res) {
  res.render('auth/login', { title: 'Login' });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    req.session.error = 'Email and password required.';
    return res.redirect('/login');
  }

  const user = userModel.findByEmail(email.toLowerCase());
  if (!user) {
    req.session.error = 'Invalid credentials.';
    return res.redirect('/login');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    req.session.error = 'Invalid credentials.';
    return res.redirect('/login');
  }

  req.session.user = {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
  };
  req.session.success = 'Logged in successfully.';
  return res.redirect('/dashboard');
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

