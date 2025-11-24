const resourceModel = require('../models/resourceModel');
const domainModel = require('../models/domainModel');

function showLanding(req, res) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('home', { title: 'My Resource Hub' });
}

function showDashboard(req, res) {
  const userId = req.session.user.id;
  const stats = {
    totalResources: resourceModel.getResourceCount(userId),
    breakdown: resourceModel.getDomainBreakdown(userId),
    recent: resourceModel.getRecentResources(userId, 5),
    favorites: resourceModel.getFavoriteResources(userId, 5),
    domains: domainModel.getAllDomains(),
  };

  res.render('dashboard', {
    title: 'Dashboard',
    stats,
  });
}

module.exports = {
  showLanding,
  showDashboard,
};

