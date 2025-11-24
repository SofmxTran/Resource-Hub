const fs = require('fs');
const path = require('path');
const domainModel = require('../models/domainModel');
const resourceModel = require('../models/resourceModel');

function cleanupFile(filePath) {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', 'uploads', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function listResources(req, res) {
  const filters = {
    domain: req.query.domain || 'all',
    type: req.query.type || 'all',
    purpose: req.query.purpose || 'all',
    favorite: req.query.favorite || '0',
    q: req.query.q || '',
  };

  const resources = resourceModel.getAllResources(req.session.user.id, filters);
  const domains = domainModel.getAllDomains();

  res.render('resources/index', {
    title: 'Resources',
    resources,
    domains,
    filters,
  });
}

function renderNewResource(req, res) {
  const domains = domainModel.getAllDomains();
  res.render('resources/new', { title: 'New Resource', domains });
}

function createResource(req, res) {
  const { title, description, domainId, type, url, purpose } = req.body;
  const file = req.file;
  const cleanPurpose = purpose || null;

  if (!title || !type) {
    req.session.error = 'Title and type are required.';
    return res.redirect('/resources/new');
  }

  if (type === 'FILE' && !file) {
    req.session.error = 'Please upload a file.';
    return res.redirect('/resources/new');
  }

  if (type === 'LINK' && !url) {
    req.session.error = 'Please provide a URL.';
    return res.redirect('/resources/new');
  }

  resourceModel.createResource({
    userId: req.session.user.id,
    domainId,
    title,
    description,
    type,
    filePath: file ? file.filename : null,
    url: type === 'LINK' ? url : null,
    purpose: cleanPurpose,
  });

  req.session.success = 'Resource added.';
  return res.redirect('/resources');
}

function renderEditResource(req, res) {
  const resource = resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }
  const domains = domainModel.getAllDomains();
  res.render('resources/edit', {
    title: `Edit ${resource.title}`,
    resource,
    domains,
  });
}

function updateResourceHandler(req, res) {
  const { title, description, domainId, type, url, purpose } = req.body;
  const resource = resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }

  const file = req.file;
  let filePath = resource.file_path;
  if (type === 'FILE' && file) {
    cleanupFile(resource.file_path);
    filePath = file.filename;
  } else if (type === 'LINK') {
    cleanupFile(resource.file_path);
    filePath = null;
  }

  resourceModel.updateResource(req.params.id, req.session.user.id, {
    domainId,
    title,
    description,
    type,
    filePath,
    url: type === 'LINK' ? url : null,
    purpose: purpose || null,
  });

  req.session.success = 'Resource updated.';
  return res.redirect('/resources');
}

function deleteResourceHandler(req, res) {
  const resource = resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }

  cleanupFile(resource.file_path);
  resourceModel.deleteResource(req.params.id, req.session.user.id);
  req.session.success = 'Resource deleted.';
  return res.redirect('/resources');
}

function toggleFavoriteHandler(req, res) {
  const resource = resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }

  const newValue = resource.is_favorite ? 0 : 1;
  resourceModel.toggleFavorite(req.params.id, req.session.user.id, newValue);
  return res.redirect('/resources');
}

module.exports = {
  listResources,
  renderNewResource,
  createResource,
  renderEditResource,
  updateResourceHandler,
  deleteResourceHandler,
  toggleFavoriteHandler,
};

