function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.error = 'Please login to continue.';
  return res.redirect('/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return next();
}

function ensureAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  if (req.accepts('html')) {
    req.session.error = 'You must be an admin to access that page.';
    return res.redirect('/');
  }
  return res.status(403).send('Forbidden');
}

module.exports = {
  ensureAuthenticated,
  redirectIfAuthenticated,
  ensureAdmin,
};

