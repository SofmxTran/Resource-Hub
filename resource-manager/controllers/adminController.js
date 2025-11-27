const resourceModel = require('../models/resourceModel');
const userModel = require('../models/userModel');

async function renderDashboard(_req, res) {
  const stats = {
    totalUsers: await userModel.getUserCount(),
    totalResources: await resourceModel.getTotalResourceCount(),
    pendingResources: await resourceModel.getPendingResourceCount(),
    pendingList: await resourceModel.getRecentPending(5),
  };

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats,
    activeNav: 'admin',
  });
}

async function listResources(req, res) {
  const status = (req.query.status || 'all').toUpperCase();
  const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const resources =
    allowedStatuses.includes(status) && status !== 'ALL'
      ? await resourceModel.getResourcesByStatus(status)
      : await resourceModel.getAllResourcesForAdmin();

  res.render('admin/resources', {
    title: 'Manage Resources',
    resources,
    status,
    allowedStatuses,
    activeNav: 'admin',
  });
}

async function updateResourceStatus(req, res, newStatus) {
  const resourceId = req.params.id;
  const resource = await resourceModel.getResourceForDetail(resourceId);
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/admin/resources');
  }
  await resourceModel.updateStatus(resourceId, newStatus);
  req.session.success =
    newStatus === 'APPROVED'
      ? 'Resource approved and will appear publicly.'
      : 'Resource rejected.';
  
  // If coming from resource detail page, redirect back there; otherwise go to admin panel
  const referer = req.get('Referer') || '';
  if (referer.includes(`/resources/${resourceId}`) && !referer.includes('/admin')) {
    return res.redirect(`/resources/${resourceId}`);
  }
  return res.redirect('/admin/resources?status=PENDING');
}

function approveResource(req, res) {
  return updateResourceStatus(req, res, 'APPROVED');
}

function rejectResource(req, res) {
  return updateResourceStatus(req, res, 'REJECTED');
}

async function deleteResource(req, res) {
  const resourceId = req.params.id;
  const resource = await resourceModel.getResourceForDetail(resourceId);
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/admin/resources');
  }
  await resourceModel.deleteResourceByAdmin(resourceId);
  req.session.success = 'Resource deleted.';
  return res.redirect('/admin/resources');
}

module.exports = {
  renderDashboard,
  listResources,
  approveResource,
  rejectResource,
  deleteResource,
};

