const userModel = require('../models/userModel');
const resourceModel = require('../models/resourceModel');

function showProfile(req, res) {
  const userId = req.session.user.id;
  const user = userModel.findById(userId);
  if (!user) {
    req.session.error = 'Unable to load profile.';
    return res.redirect('/login');
  }
  const resources = resourceModel.getResourcesForUser(userId);
  const stats = resourceModel.getUserVisibilityStats(userId);

  res.render('profile', {
    title: 'My Profile',
    user,
    resources,
    stats,
  });
}

function showPublicProfile(req, res) {
  const username = (req.params.username || '').trim().toLowerCase();
  const profileUser = userModel.findByUsername(username);

  if (!profileUser) {
    return res.status(404).render('404', { title: 'User Not Found' });
  }

  const resources = resourceModel.getPublicResourcesByUser(profileUser.id);

  res.render('public-profile', {
    title: `${profileUser.username} - Public Resources`,
    profileUser,
    resources,
  });
}

module.exports = {
  showProfile,
  showPublicProfile,
};

