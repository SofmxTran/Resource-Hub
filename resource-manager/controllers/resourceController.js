const domainModel = require('../models/domainModel');
const resourceModel = require('../models/resourceModel');
const commentModel = require('../models/commentModel');
const voteModel = require('../models/voteModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

/**
 * Delete a file from Cloudinary
 * @param {string} fileUrl - Cloudinary URL or local file path (for backward compatibility)
 */
async function cleanupFile(fileUrl) {
  if (!fileUrl) return;
  // If it's a Cloudinary URL, delete from Cloudinary
  if (fileUrl.includes('cloudinary.com')) {
    await deleteFromCloudinary(fileUrl, 'auto');
  }
  // Otherwise, it might be an old local file path - we can ignore it
  // (local files will be cleaned up manually if needed)
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
  if (resource.isPublic && resource.status === 'APPROVED') {
    return true;
  }
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.id === resource.userId?.toString() || user.id === resource.user_id;
}

async function listResources(req, res) {
  try {
    const filters = {
      domain: req.query.domain || 'all',
      type: (req.query.type || '').toUpperCase() || 'all',
      purpose: req.query.purpose || 'all',
      favorite: req.query.favorite || '0',
      status: req.query.status || 'ALL',
      q: req.query.q || '',
    };
    if (!['FILE', 'LINK', 'POST'].includes(filters.type)) {
      filters.type = 'all';
    }
    // Normalize status: 'ALL' means show all, otherwise must be valid status
    filters.status = (filters.status || 'ALL').toUpperCase();
    if (!['PENDING', 'APPROVED', 'REJECTED', 'ALL'].includes(filters.status)) {
      filters.status = 'ALL';
    }

    const resources = await resourceModel.getAllResources(req.session.user.id, filters);
    const domains = await domainModel.getAllDomains();

    // Debug logging
    console.log('=== Resources List Debug ===');
    console.log('Resources count:', resources.length);
    if (resources.length > 0) {
      resources.forEach((res, idx) => {
        console.log(`Resource ${idx + 1}:`, {
          id: res.id,
          title: res.title,
          type: res.type,
          domain_name: res.domain_name,
          domain_id: res.domain_id,
          purpose: res.purpose,
          status: res.status,
        });
      });
    }

    res.render('resources/index', {
      title: 'My Resources',
      resources,
      domains,
      filters,
      activeNav: 'resources',
    });
  } catch (error) {
    console.error('Error in listResources:', error);
    req.session.error = 'Failed to load resources. Please try again.';
    res.redirect('/dashboard');
  }
}

async function renderNewResource(req, res) {
  const domains = await domainModel.getAllDomains();
  res.render('resources/new', { 
    title: 'New Resource', 
    domains,
    activeNav: 'resources',
  });
}

async function createResource(req, res) {
  const { title, description, domainId, type, url, purpose, guideText, content, isPublic } =
    req.body;
  const { fileUpload, imageUpload } = getUploadedFiles(req);
  const cleanTitle = (title || '').trim();
  const cleanDescription = (description || '').trim();
  const cleanPurpose = (purpose || '').trim() || null;
  const cleanGuide = (guideText || '').trim() || null;
  const cleanContent = (content || '').trim() || null;
  const cleanType = type === 'FILE' ? 'FILE' : type === 'POST' ? 'POST' : 'LINK';
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

  if (cleanType === 'POST' && !cleanContent) {
    req.session.error = 'Please provide content for your post.';
    return res.redirect('/resources/new');
  }

  // Upload files to Cloudinary
  let filePath = null;
  let imagePath = null;

  try {
    if (fileUpload) {
      if (!fileUpload.buffer) {
        throw new Error('File buffer is missing. Make sure multer is using memory storage.');
      }
      console.log(`Uploading file to Cloudinary: ${fileUpload.originalname} (${fileUpload.size} bytes)`);
      const uploadResult = await uploadToCloudinary(
        fileUpload.buffer,
        'resources/files',
        'auto'
      );
      filePath = uploadResult.url;
    }

    if (imageUpload) {
      if (!imageUpload.buffer) {
        throw new Error('Image buffer is missing. Make sure multer is using memory storage.');
      }
      console.log(`Uploading image to Cloudinary: ${imageUpload.originalname} (${imageUpload.size} bytes)`);
      const uploadResult = await uploadToCloudinary(
        imageUpload.buffer,
        'resources/images',
        'image'
      );
      imagePath = uploadResult.url;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });
    req.session.error = `Failed to upload file: ${error.message || 'Unknown error'}. Please try again.`;
    return res.redirect('/resources/new');
  }

  const status = determineStatus({
    isPublic: publicFlag,
    isAdmin,
    previousStatus: 'PENDING',
    wasPublic: false,
  });

  await resourceModel.createResource({
    userId: req.session.user.id,
    domainId,
    title: cleanTitle,
    description: cleanDescription || null,
    type: cleanType,
    filePath: filePath,
    imagePath: imagePath,
    url: cleanType === 'LINK' ? cleanUrl : null,
    purpose: cleanPurpose,
    guideText: cleanGuide,
    content: cleanType === 'POST' ? cleanContent : null,
    isPublic: publicFlag,
    status,
  });

  req.session.success = publicFlag
    ? 'Resource submitted! An admin will review it soon.'
    : 'Resource added.';
  return res.redirect('/resources');
}

async function renderEditResource(req, res) {
  const resource = await resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }
  const domains = await domainModel.getAllDomains();
  res.render('resources/edit', {
    title: `Edit ${resource.title}`,
    resource,
    domains,
    activeNav: 'resources',
  });
}

async function updateResourceHandler(req, res) {
  const { title, description, domainId, type, url, purpose, guideText, content, isPublic } =
    req.body;
  const resource = await resourceModel.getResourceById(
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
  const cleanContent = (content || '').trim() || null;
  const { fileUpload, imageUpload } = getUploadedFiles(req);
  let filePath = resource.filePath || resource.file_path;
  let imagePath = resource.imagePath || resource.image_path;
  const cleanType = type === 'FILE' ? 'FILE' : type === 'POST' ? 'POST' : 'LINK';
  const cleanUrl = (url || '').trim();
  const publicFlag = isPublic === 'on';
  const isAdmin = req.session.user.isAdmin;

  if (!cleanTitle) {
    req.session.error = 'Title is required.';
    return res.redirect(`/resources/${req.params.id}/edit`);
  }

  // Handle file uploads to Cloudinary
  try {
    if (cleanType === 'FILE' && fileUpload) {
      // Delete old file from Cloudinary if it exists
      if (resource.filePath || resource.file_path) {
        await cleanupFile(resource.filePath || resource.file_path);
      }
      // Upload new file to Cloudinary
      const uploadResult = await uploadToCloudinary(
        fileUpload.buffer,
        'resources/files',
        'auto'
      );
      filePath = uploadResult.url;
    } else if (cleanType === 'LINK' || cleanType === 'POST') {
      // Delete old file from Cloudinary if switching from FILE to LINK/POST
      if (resource.filePath || resource.file_path) {
        await cleanupFile(resource.filePath || resource.file_path);
      }
      filePath = null;
    }

    if (imageUpload) {
      // Delete old image from Cloudinary if it exists
      if (resource.imagePath || resource.image_path) {
        await cleanupFile(resource.imagePath || resource.image_path);
      }
      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(
        imageUpload.buffer,
        'resources/images',
        'image'
      );
      imagePath = uploadResult.url;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });
    req.session.error = `Failed to upload file: ${error.message || 'Unknown error'}. Please try again.`;
    return res.redirect(`/resources/${req.params.id}/edit`);
  }

  if (cleanType === 'LINK' && !cleanUrl) {
    req.session.error = 'Please provide a URL.';
    return res.redirect(`/resources/${req.params.id}/edit`);
  }

  if (cleanType === 'POST' && !cleanContent) {
    req.session.error = 'Please provide content for your post.';
    return res.redirect(`/resources/${req.params.id}/edit`);
  }

  const status = determineStatus({
    isPublic: publicFlag,
    isAdmin,
    previousStatus: resource.status,
    wasPublic: !!(resource.isPublic || resource.is_public),
  });

  await resourceModel.updateResource(req.params.id, req.session.user.id, {
    domainId,
    title: cleanTitle,
    description: cleanDescription || null,
    type: cleanType,
    filePath,
    imagePath,
    url: cleanType === 'LINK' ? cleanUrl : null,
    purpose: cleanPurpose,
    guideText: cleanGuide,
    content: cleanType === 'POST' ? cleanContent : null,
    isPublic: publicFlag,
    status,
  });

  req.session.success = 'Resource updated.';
  return res.redirect('/resources');
}

async function deleteResourceHandler(req, res) {
  const resource = await resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }

  // Delete files from Cloudinary
  await cleanupFile(resource.filePath || resource.file_path);
  await cleanupFile(resource.imagePath || resource.image_path);
  
  await resourceModel.deleteResource(req.params.id, req.session.user.id);
  req.session.success = 'Resource deleted.';
  return res.redirect('/resources');
}

async function toggleFavoriteHandler(req, res) {
  const resource = await resourceModel.getResourceById(
    req.params.id,
    req.session.user.id
  );
  if (!resource) {
    req.session.error = 'Resource not found.';
    return res.redirect('/resources');
  }

  const newValue = !(resource.isFavorite || resource.is_favorite);
  await resourceModel.toggleFavorite(req.params.id, req.session.user.id, newValue);
  return res.redirect('/resources');
}

async function showResourceDetail(req, res) {
  const resource = await resourceModel.getResourceForDetail(req.params.id);
  if (!canViewResource(resource, req.session.user)) {
    req.session.error = 'Resource not found or not accessible.';
    return res.redirect('/');
  }
  const comments = await commentModel.getCommentsForResource(resource.id);
  const userVote =
    req.session.user && req.session.user.id
      ? await voteModel.getVote(resource.id, req.session.user.id)
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

async function addComment(req, res) {
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
  const resource = await resourceModel.getResourceForDetail(req.params.id);
  if (!canViewResource(resource, req.session.user)) {
    req.session.error = 'Cannot comment on that resource.';
    return res.redirect('/');
  }
  if (!content) {
    req.session.error = 'Comment cannot be empty.';
    return res.redirect(`/resources/${resource.id}`);
  }
  await commentModel.createComment({
    resourceId: resource.id,
    userId: req.session.user.id,
    content,
    rating,
  });
  req.session.success = 'Thanks for the feedback!';
  return res.redirect(`/resources/${resource.id}`);
}

async function deleteComment(req, res) {
  const commentId = req.params.commentId;
  const resourceId = req.params.id;
  const user = req.session.user;
  if (!user) {
    req.session.error = 'You must be logged in.';
    return res.redirect(`/resources/${resourceId}`);
  }
  const result = await commentModel.deleteComment(commentId, resourceId, user.id, user.isAdmin);
  if (result.changes) {
    req.session.success = 'Comment deleted.';
  } else {
    req.session.error = 'Unable to delete comment.';
  }
  return res.redirect(`/resources/${resourceId}`);
}

async function submitTrustVote(req, res) {
  const resource = await resourceModel.getResourceForDetail(req.params.id);
  if (!canViewResource(resource, req.session.user)) {
    req.session.error = 'Resource not accessible.';
    return res.redirect('/');
  }
  const user = req.session.user;
  const resourceOwnerId = resource.userId?.toString() || resource.user_id;
  if (user.id === resourceOwnerId) {
    req.session.error = 'You cannot vote on your own resource.';
    return res.redirect(`/resources/${resource.id}`);
  }
  const existingVote = await voteModel.getVote(resource.id, user.id);
  if (existingVote) {
    await voteModel.removeVote(resource.id, user.id);
    req.session.success = 'Removed your trust vote.';
  } else {
    await voteModel.addVote(resource.id, user.id);
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

