const fs = require('fs');
const path = require('path');
const domainModel = require('../models/domainModel');
const resourceModel = require('../models/resourceModel');
const commentModel = require('../models/commentModel');
const voteModel = require('../models/voteModel');

function cleanupFile(filePath) {
  if (!filePath) return;
  const uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
  const fullPath = path.join(uploadsDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function getUploadedFiles(req) {
  const uploads = req.files || {};
  const fileUpload = uploads.fileUpload ? uploads.fileUpload[0] : null;
  const imageUpload = uploads.imageUpload ? uploads.imageUpload[0] : null;
  return { fileUpload, imageUpload };
}

function determineStatus({ isPublic, isAdmin, previousStatus, wasPublic }) {
  if (!isPublic) {
    return 'APPROVED';
  }
  if (isAdmin) {
    return 'APPROVED';
  }
  if (!wasPublic) {
    return 'PENDING';
  }
  if (previousStatus === 'APPROVED') {
    return 'APPROVED';
  }
  return 'PENDING';
}

function canViewResource(resource, user) {
  if (!resource) return false;
  if (resource.is_public && resource.status === 'APPROVED') {
    return true;
  }
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.id === resource.user_id;
}

function listResources(req, res) {
  const filters = {
    domain: req.query.domain || 'all',
    type: (req.query.type || '').toUpperCase() || 'all',
    purpose: req.query.purpose || 'all',
    favorite: req.query.favorite || '0',
    status: req.query.status || 'ALL',
    q: req.query.q || '',
  };
  if (!['FILE', 'LINK'].includes(filters.type)) {
    filters.type = 'all';
  }
  // Normalize status: 'ALL' means show all, otherwise must be valid status
  filters.status = (filters.status || 'ALL').toUpperCase();
  if (!['PENDING', 'APPROVED', 'REJECTED', 'ALL'].includes(filters.status)) {
    filters.status = 'ALL';
  }

  const resources = resourceModel.getAllResources(req.session.user.id, filters);
  const domains = domainModel.getAllDomains();

  res.render('resources/index', {
    title: 'My Resources',
    resources,
    domains,
    filters,
    activeNav: 'resources',
  });
}

function renderNewResource(req, res) {
  const domains = domainModel.getAllDomains();
  res.render('resources/new', { 
    title: 'New Resource', 
    domains,
    activeNav: 'resources',
  });
}

function createResource(req, res) {
  const { title, description, domainId, type, url, purpose, guideText, isPublic } =
    req.body;
  const { fileUpload, imageUpload } = getUploadedFiles(req);
  const cleanTitle = (title || '').trim();
  const cleanDescription = (description || '').trim();
  const cleanPurpose = (purpose || '').trim() || null;
  const cleanGuide = (guideText || '').trim() || null;
  const cleanType = type === 'FILE' ? 'FILE' : 'LINK';
  const cleanUrl = (url || '').trim();
  const publicFlag = isPublic === 'on';
  const isAdmin = req.session.user.isAdmin;

  if (!cleanTitle || !type) {
    req.session.error = 'Title and type are required.';
    return res.redirect('/resources/new');
  }

  if (cleanType === 'FILE' && !fileUpload) {
    req.session.error = 'Please upload a file.';
    return res.redirect('/resources/new');
  }

  if (cleanType === 'LINK' && !cleanUrl) {
    req.session.error = 'Please provide a URL.';
    return res.redirect('/resources/new');
  }

  const status = determineStatus({
    isPublic: publicFlag,
    isAdmin,
    previousStatus: 'PENDING',
    wasPublic: false,
  });

  resourceModel.createResource({
    userId: req.session.user.id,
    domainId,
    title: cleanTitle,
    description: cleanDescription || null,
    type: cleanType,
    filePath: fileUpload ? fileUpload.filename : null,
    imagePath: imageUpload ? imageUpload.filename : null,
    url: cleanType === 'LINK' ? cleanUrl : null,
    purpose: cleanPurpose,
    guideText: cleanGuide,
    isPublic: publicFlag,
    status,
  });

  req.session.success = publicFlag
    ? 'Resource submitted! An admin will review it soon.'
    : 'Resource added.';
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
    activeNav: 'resources',
  });
}

function updateResourceHandler(req, res) {
  const { title, description, domainId, type, url, purpose, guideText, isPublic } =
    req.body;
  const resource = resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }

  const cleanTitle = (title || '').trim();
  const cleanDescription = (description || '').trim();
  const cleanPurpose = (purpose || '').trim() || null;
  const cleanGuide = (guideText || '').trim() || null;
  const { fileUpload, imageUpload } = getUploadedFiles(req);
  let filePath = resource.file_path;
  let imagePath = resource.image_path;
  const cleanType = type === 'FILE' ? 'FILE' : 'LINK';
  const cleanUrl = (url || '').trim();
  const publicFlag = isPublic === 'on';
  const isAdmin = req.session.user.isAdmin;

  if (!cleanTitle) {
    req.session.error = 'Title is required.';
    return res.redirect(`/resources/${req.params.id}/edit`);
  }

  if (cleanType === 'FILE' && fileUpload) {
    cleanupFile(resource.file_path);
    filePath = fileUpload.filename;
  } else if (cleanType === 'LINK') {
    cleanupFile(resource.file_path);
    filePath = null;
  }

  if (imageUpload) {
    cleanupFile(resource.image_path);
    imagePath = imageUpload.filename;
  }

  if (cleanType === 'LINK' && !cleanUrl) {
    req.session.error = 'Please provide a URL.';
    return res.redirect(`/resources/${req.params.id}/edit`);
  }

  const status = determineStatus({
    isPublic: publicFlag,
    isAdmin,
    previousStatus: resource.status,
    wasPublic: !!resource.is_public,
  });

  resourceModel.updateResource(req.params.id, req.session.user.id, {
    domainId,
    title: cleanTitle,
    description: cleanDescription || null,
    type: cleanType,
    filePath,
    imagePath,
    url: cleanType === 'LINK' ? cleanUrl : null,
    purpose: cleanPurpose,
    guideText: cleanGuide,
    isPublic: publicFlag,
    status,
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
  cleanupFile(resource.image_path);
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

function showResourceDetail(req, res) {
  const resource = resourceModel.getResourceForDetail(req.params.id);
  if (!canViewResource(resource, req.session.user)) {
    req.session.error = 'Resource not found or not accessible.';
    return res.redirect('/');
  }
  const comments = commentModel.getCommentsForResource(resource.id);
  const userVote =
    req.session.user && req.session.user.id
      ? voteModel.getVote(resource.id, req.session.user.id)
      : null;
  const isAdmin = req.session.user && req.session.user.isAdmin;

  res.render('resources/show', {
    title: resource.title,
    resource,
    comments,
    userVote,
    isAdmin,
    activeNav: null, // Resource detail page should not highlight any navbar tab
  });
}

function addComment(req, res) {
  const content = (req.body.content || '').trim();
  let rating = null;
  if (req.body.rating) {
    const parsed = Number(req.body.rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      req.session.error = 'Rating must be between 1 and 5.';
      return res.redirect(`/resources/${req.params.id}`);
    }
    rating = parsed;
  }
  const resource = resourceModel.getResourceForDetail(req.params.id);
  if (!canViewResource(resource, req.session.user)) {
    req.session.error = 'Cannot comment on that resource.';
    return res.redirect('/');
  }
  if (!content) {
    req.session.error = 'Comment cannot be empty.';
    return res.redirect(`/resources/${resource.id}`);
  }
  commentModel.createComment({
    resourceId: resource.id,
    userId: req.session.user.id,
    content,
    rating,
  });
  req.session.success = 'Thanks for the feedback!';
  return res.redirect(`/resources/${resource.id}`);
}

function deleteComment(req, res) {
  const commentId = req.params.commentId;
  const resourceId = req.params.id;
  const user = req.session.user;
  if (!user) {
    req.session.error = 'You must be logged in.';
    return res.redirect(`/resources/${resourceId}`);
  }
  const result = commentModel.deleteComment(commentId, resourceId, user.id, user.isAdmin);
  if (result.changes) {
    req.session.success = 'Comment deleted.';
  } else {
    req.session.error = 'Unable to delete comment.';
  }
  return res.redirect(`/resources/${resourceId}`);
}

function submitTrustVote(req, res) {
  const resource = resourceModel.getResourceForDetail(req.params.id);
  if (!canViewResource(resource, req.session.user)) {
    req.session.error = 'Resource not accessible.';
    return res.redirect('/');
  }
  const user = req.session.user;
  if (user.id === resource.user_id) {
    req.session.error = 'You cannot vote on your own resource.';
    return res.redirect(`/resources/${resource.id}`);
  }
  const existingVote = voteModel.getVote(resource.id, user.id);
  if (existingVote) {
    voteModel.removeVote(resource.id, user.id);
    req.session.success = 'Removed your trust vote.';
  } else {
    voteModel.addVote(resource.id, user.id);
    req.session.success = 'Thanks for trusting this resource!';
  }
  return res.redirect(`/resources/${resource.id}`);
}

module.exports = {
  listResources,
  renderNewResource,
  createResource,
  renderEditResource,
  updateResourceHandler,
  deleteResourceHandler,
  toggleFavoriteHandler,
  showResourceDetail,
  addComment,
  deleteComment,
  submitTrustVote,
};

