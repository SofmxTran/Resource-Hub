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
  const visibilityStats = resourceModel.getUserVisibilityStats(userId);
  const userStats = userModel.getUserStats(userId);

  res.render('profile', {
    title: 'My Profile',
    user,
    resources,
    stats: visibilityStats,
    userStats,
    activeNav: 'profile',
  });
}

function showPublicProfile(req, res) {
  const username = (req.params.username || '').trim().toLowerCase();
  const profileUser = userModel.findByUsername(username);

  if (!profileUser) {
    return res.status(404).render('404', { title: 'User Not Found', activeNav: null });
  }

  const resources = resourceModel.getPublicResourcesByUser(profileUser.id);
  const userStats = userModel.getUserStats(profileUser.id);

  res.render('public-profile', {
    title: `${profileUser.display_name || profileUser.username} - Public Profile`,
    profileUser,
    resources,
    userStats,
    activeNav: null,
  });
}

module.exports = {
  showProfile,
  showPublicProfile,
};

