const userModel = require('../models/userModel');
const resourceModel = require('../models/resourceModel');

async function showProfile(req, res) {
  const userId = req.session.user.id;
  const user = await userModel.findById(userId);
  if (!user) {
    req.session.error = 'Unable to load profile.';
    return res.redirect('/login');
  }
  const resources = await resourceModel.getResourcesForUser(userId);
  const visibilityStats = await resourceModel.getUserVisibilityStats(userId);
  const userStats = await userModel.getUserStats(userId);

  res.render('profile', {
    title: 'My Profile',
    user,
    resources,
    stats: visibilityStats,
    userStats,
    activeNav: 'profile',
  });
}

async function showPublicProfile(req, res) {
  const username = (req.params.username || '').trim().toLowerCase();
  const profileUser = await userModel.findByUsername(username);

  if (!profileUser) {
    return res.status(404).render('404', { title: 'User Not Found', activeNav: null });
  }

  const resources = await resourceModel.getPublicResourcesByUser(profileUser.id);
  const userStats = await userModel.getUserStats(profileUser.id);

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

