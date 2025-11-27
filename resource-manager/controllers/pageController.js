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

async function showHome(req, res) {
  const filters = buildFeedFilters(req.query);
  const feed = await resourceModel.getPublicResources(filters, 20);
  const domains = await domainModel.getAllDomains();

  res.render('home', {
    title: 'My Resource Hub',
    filters,
    feed,
    domains,
    activeNav: 'home',
  });
}

async function showDashboard(req, res) {
  const userId = req.session.user.id;
  const stats = {
    totalResources: await resourceModel.getResourceCount(userId),
    breakdown: await resourceModel.getDomainBreakdown(userId),
    recent: await resourceModel.getRecentResources(userId, 5),
    favorites: await resourceModel.getFavoriteResources(userId, 5),
    domains: await domainModel.getAllDomains(),
    visibility: await resourceModel.getUserVisibilityStats(userId),
    publicFeed: await resourceModel.getPublicResources({}, 5),
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

