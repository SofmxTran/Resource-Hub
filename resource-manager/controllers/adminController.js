const resourceModel = require('../models/resourceModel');
const userModel = require('../models/userModel');

function renderDashboard(_req, res) {
  const stats = {
    totalUsers: userModel.getUserCount(),
    totalResources: resourceModel.getTotalResourceCount(),
    pendingResources: resourceModel.getPendingResourceCount(),
    pendingList: resourceModel.getRecentPending(5),
  };

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats,
  });
}

function listResources(req, res) {
  const status = (req.query.status || 'all').toUpperCase();
  const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  const resources =
    allowedStatuses.includes(status) && status !== 'ALL'
      ? resourceModel.getResourcesByStatus(status)
      : resourceModel.getAllResourcesForAdmin();

  res.render('admin/resources', {
    title: 'Manage Resources',
    resources,
    status,
    allowedStatuses,
  });
}

function updateResourceStatus(req, res, newStatus) {
  const resourceId = req.params.id;
  const resource = resourceModel.getResourceForDetail(resourceId);
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/admin/resources');
  }
  resourceModel.updateStatus(resourceId, newStatus);
  req.session.success =
    newStatus === 'APPROVED'
      ? 'Resource approved and will appear publicly.'
      : 'Resource rejected.';
  return res.redirect('/admin/resources?status=PENDING');
}

function approveResource(req, res) {
  return updateResourceStatus(req, res, 'APPROVED');
}

function rejectResource(req, res) {
  return updateResourceStatus(req, res, 'REJECTED');
}

function deleteResource(req, res) {
  const resourceId = req.params.id;
  const resource = resourceModel.getResourceForDetail(resourceId);
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/admin/resources');
  }
  resourceModel.deleteResourceByAdmin(resourceId);
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

