const resourceModel = require('../models/resourceModel');
const domainModel = require('../models/domainModel');

function buildFeedFilters(query = {}) {
  const typeRaw = (query.type || '').toUpperCase();
  const allowedTypes = ['FILE', 'LINK'];
  const type = allowedTypes.includes(typeRaw) ? typeRaw : 'all';

  const purposeRaw = (query.purpose || '').trim();

  return {
    q: (query.q || '').trim(),
    domain: query.domain || 'all',
    type,
    purpose: purposeRaw || 'all',
  };
}

function showHome(req, res) {
  const filters = buildFeedFilters(req.query);
  const feed = resourceModel.getPublicResources(filters, 20);
  const domains = domainModel.getAllDomains();

  res.render('home', {
    title: 'My Resource Hub',
    filters,
    feed,
    domains,
    activeNav: 'home',
  });
}

function showDashboard(req, res) {
  const userId = req.session.user.id;
  const stats = {
    totalResources: resourceModel.getResourceCount(userId),
    breakdown: resourceModel.getDomainBreakdown(userId),
    recent: resourceModel.getRecentResources(userId, 5),
    favorites: resourceModel.getFavoriteResources(userId, 5),
    domains: domainModel.getAllDomains(),
    visibility: resourceModel.getUserVisibilityStats(userId),
    publicFeed: resourceModel.getPublicResources({}, 5),
  };

  res.render('dashboard', {
    title: 'Dashboard',
    stats,
    activeNav: 'dashboard',
  });
}

module.exports = {
  showHome,
  showDashboard,
};

