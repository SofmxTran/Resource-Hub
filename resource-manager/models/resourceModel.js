const mongoose = require('mongoose');
const Resource = require('./Resource');
const ResourceVote = require('./ResourceVote');

// Helper to convert string to ObjectId if needed
function toObjectId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  }
  return id;
}

// Helper to calculate trust score for a resource
async function getTrustScore(resourceId) {
  const result = await ResourceVote.aggregate([
    { $match: { resourceId: toObjectId(resourceId) } },
    { $group: { _id: '$resourceId', trustScore: { $sum: '$value' } } },
  ]);
  return result.length > 0 ? result[0].trustScore : 0;
}

// Helper to add trust score to resources
async function addTrustScoresToResources(resources) {
  const resourceIds = resources.map((r) => r._id || r.id);
  const votes = await ResourceVote.aggregate([
    { $match: { resourceId: { $in: resourceIds } } },
    { $group: { _id: '$resourceId', trustScore: { $sum: '$value' } } },
  ]);
  const voteMap = {};
  votes.forEach((v) => {
    voteMap[v._id.toString()] = v.trustScore;
  });

  return resources.map((r) => {
    const id = (r._id || r.id).toString();
    return {
      ...r.toObject ? r.toObject() : r,
      id: id,
      trust_score: voteMap[id] || 0,
    };
  });
}

function buildFilters(userId, filters = {}) {
  const match = { userId: toObjectId(userId) };

  if (filters.domain && filters.domain !== 'all') {
    match.domainId = toObjectId(filters.domain);
  }

  if (filters.type && filters.type !== 'all') {
    match.type = filters.type;
  }

  if (filters.purpose && filters.purpose !== 'all') {
    match.purpose = filters.purpose;
  }

  if (filters.favorite === '1') {
    match.isFavorite = true;
  }

  if (filters.status && filters.status !== 'ALL') {
    match.status = filters.status;
  }

  if (filters.q) {
    match.$or = [
      { title: { $regex: filters.q, $options: 'i' } },
      { description: { $regex: filters.q, $options: 'i' } },
    ];
  }

  return match;
}

function buildPublicFilters(filters = {}) {
  const match = { isPublic: true, status: 'APPROVED' };

  if (filters.domain && filters.domain !== 'all') {
    match.domainId = toObjectId(filters.domain);
  }

  if (filters.type && filters.type !== 'all') {
    match.type = filters.type;
  }

  if (filters.purpose && filters.purpose !== 'all') {
    match.purpose = filters.purpose;
  }

  if (filters.q) {
    match.$or = [
      { title: { $regex: filters.q, $options: 'i' } },
      { description: { $regex: filters.q, $options: 'i' } },
    ];
  }

  if (filters.username) {
    // We'll need to join with User model for this
    match['userId.username'] = filters.username.toLowerCase();
  }

  return match;
}

async function getAllResources(userId, filters = {}) {
  const match = buildFilters(userId, filters);
  const resources = await Resource.find(match)
    .populate('domainId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return await addTrustScoresToResources(resources);
}

async function getResourceById(id, userId) {
  const resource = await Resource.findOne({
    _id: id,
    userId: toObjectId(userId),
  })
    .populate('domainId', 'name')
    .lean();

  if (!resource) return null;

  const trustScore = await getTrustScore(resource._id);
  return {
    ...resource,
    id: resource._id.toString(),
    trust_score: trustScore,
  };
}

async function getResourceForDetail(id) {
  const resource = await Resource.findById(id)
    .populate('domainId', 'name')
    .populate('userId', 'username fullName displayName avatarPath')
    .lean();

  if (!resource) return null;

  const trustScore = await getTrustScore(resource._id);
  return {
    ...resource,
    id: resource._id.toString(),
    domain_name: resource.domainId?.name || null,
    username: resource.userId?.username || null,
    full_name: resource.userId?.fullName || null,
    display_name: resource.userId?.displayName || null,
    avatar_path: resource.userId?.avatarPath || null,
    owner_id: resource.userId?._id?.toString() || null,
    trust_score: trustScore,
  };
}

async function createResource({
  userId,
  domainId,
  title,
  description,
  type,
  filePath,
  imagePath,
  url,
  purpose,
  guideText,
  isPublic,
  status = 'PENDING',
}) {
  const resource = new Resource({
    userId: toObjectId(userId),
    domainId: domainId ? toObjectId(domainId) : null,
    title,
    description,
    type,
    filePath: filePath || null,
    imagePath: imagePath || null,
    url: url || null,
    purpose: purpose || null,
    guideText: guideText || null,
    isPublic: isPublic !== false,
    status,
  });
  await resource.save();
  return resource._id.toString();
}

async function updateResource(id, userId, {
  domainId,
  title,
  description,
  type,
  filePath,
  imagePath,
  url,
  purpose,
  guideText,
  isPublic,
  status,
}) {
  const updateData = {
    domainId: domainId && require('mongoose').Types.ObjectId.isValid(domainId) ? new require('mongoose').Types.ObjectId(domainId) : domainId || null,
    title,
    description,
    type,
    filePath: filePath || null,
    imagePath: imagePath || null,
    url: url || null,
    purpose: purpose || null,
    guideText: guideText || null,
    isPublic: isPublic !== false,
    status,
  };

  const resource = await Resource.findOneAndUpdate(
    { _id: id, userId: toObjectId(userId) },
    updateData,
    { new: true }
  );
  return { changes: resource ? 1 : 0 };
}

async function updateStatus(id, status) {
  const resource = await Resource.findByIdAndUpdate(id, { status }, { new: true });
  return { changes: resource ? 1 : 0 };
}

async function deleteResource(id, userId) {
  const result = await Resource.deleteOne({
    _id: id,
    userId: toObjectId(userId),
  });
  return { changes: result.deletedCount };
}

async function deleteResourceByAdmin(id) {
  const result = await Resource.deleteOne({ _id: id });
  return { changes: result.deletedCount };
}

async function toggleFavorite(id, userId, isFavorite) {
  const resource = await Resource.findOneAndUpdate(
    { _id: id, userId: toObjectId(userId) },
    { isFavorite },
    { new: true }
  );
  return { changes: resource ? 1 : 0 };
}

async function getResourceCount(userId) {
  return await Resource.countDocuments({
    userId: toObjectId(userId),
  });
}

async function getTotalResourceCount() {
  return await Resource.countDocuments();
}

async function getPendingResourceCount() {
  return await Resource.countDocuments({ status: 'PENDING', isPublic: true });
}

async function getDomainBreakdown(userId) {
  const breakdown = await Resource.aggregate([
    { $match: { userId: toObjectId(userId) } },
    {
      $lookup: {
        from: 'domains',
        localField: 'domainId',
        foreignField: '_id',
        as: 'domain',
      },
    },
    {
      $group: {
        _id: '$domainId',
        domain_name: { $first: { $ifNull: [{ $arrayElemAt: ['$domain.name', 0] }, 'Uncategorized'] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return breakdown.map((b) => ({
    domain_name: b.domain_name,
    total: b.total,
  }));
}

async function getRecentResources(userId, limit = 5) {
  const resources = await Resource.find({
    userId: toObjectId(userId),
  })
    .populate('domainId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return resources.map((r) => ({
    ...r,
    id: r._id.toString(),
    domain_name: r.domainId?.name || null,
  }));
}

async function getFavoriteResources(userId, limit = 5) {
  const resources = await Resource.find({
    userId: toObjectId(userId),
    isFavorite: true,
  })
    .populate('domainId', 'name')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return resources.map((r) => ({
    ...r,
    id: r._id.toString(),
    domain_name: r.domainId?.name || null,
  }));
}

async function getPublicResources(filters = {}, limit = 20) {
  const match = buildPublicFilters(filters);

  // Handle username filter separately with lookup
  let pipeline = [
    { $match: { isPublic: true, status: 'APPROVED' } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  if (filters.domain && filters.domain !== 'all') {
    pipeline.push({ $match: { domainId: toObjectId(filters.domain) } });
  }

  if (filters.type && filters.type !== 'all') {
    pipeline.push({ $match: { type: filters.type } });
  }

  if (filters.purpose && filters.purpose !== 'all') {
    pipeline.push({ $match: { purpose: filters.purpose } });
  }

  if (filters.username) {
    pipeline.push({ $match: { 'user.username': filters.username.toLowerCase() } });
  }

  if (filters.q) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: filters.q, $options: 'i' } },
          { description: { $regex: filters.q, $options: 'i' } },
        ],
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'domains',
        localField: 'domainId',
        foreignField: '_id',
        as: 'domain',
      },
    },
    { $unwind: { path: '$domain', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    { $limit: limit }
  );

  const resources = await Resource.aggregate(pipeline);

  // Add trust scores
  const resourceIds = resources.map((r) => r._id);
  const votes = await ResourceVote.aggregate([
    { $match: { resourceId: { $in: resourceIds } } },
    { $group: { _id: '$resourceId', trustScore: { $sum: '$value' } } },
  ]);
  const voteMap = {};
  votes.forEach((v) => {
    voteMap[v._id.toString()] = v.trustScore;
  });

  return resources.map((r) => ({
    ...r,
    id: r._id.toString(),
    domain_name: r.domain?.name || null,
    username: r.user?.username || null,
    full_name: r.user?.fullName || null,
    display_name: r.user?.displayName || null,
    avatar_path: r.user?.avatarPath || null,
    trust_score: voteMap[r._id.toString()] || 0,
  }));
}

async function getResourcesForUser(userId) {
  const resources = await Resource.find({
    userId: toObjectId(userId),
  })
    .populate('domainId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return await addTrustScoresToResources(resources);
}

async function getPublicResourcesByUser(userId) {
  const resources = await Resource.find({
    userId: toObjectId(userId),
    isPublic: true,
    status: 'APPROVED',
  })
    .populate('domainId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return await addTrustScoresToResources(resources);
}

async function getUserVisibilityStats(userId) {
  const stats = await Resource.aggregate([
    { $match: { userId: toObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        publicCount: { $sum: { $cond: ['$isPublic', 1, 0] } },
        privateCount: { $sum: { $cond: [{ $not: '$isPublic' }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return { total: 0, public: 0, private: 0 };
  }

  return {
    total: stats[0].total || 0,
    public: stats[0].publicCount || 0,
    private: stats[0].privateCount || 0,
  };
}

async function getResourcesByStatus(status) {
  const resources = await Resource.find({ status })
    .populate('domainId', 'name')
    .populate('userId', 'username fullName displayName avatarPath')
    .sort({ createdAt: -1 })
    .lean();

  return await addTrustScoresToResources(resources);
}

async function getAllResourcesForAdmin() {
  const resources = await Resource.find({})
    .populate('domainId', 'name')
    .populate('userId', 'username fullName displayName avatarPath')
    .sort({ createdAt: -1 })
    .lean();

  return await addTrustScoresToResources(resources);
}

async function getRecentPending(limit = 5) {
  const resources = await Resource.find({ status: 'PENDING', isPublic: true })
    .populate('userId', 'username fullName displayName avatarPath')
    .populate('domainId', 'name')
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  return resources.map((r) => ({
    ...r,
    id: r._id.toString(),
    username: r.userId?.username || null,
    full_name: r.userId?.fullName || null,
    display_name: r.userId?.displayName || null,
    avatar_path: r.userId?.avatarPath || null,
    domain_name: r.domainId?.name || null,
  }));
}

module.exports = {
  getAllResources,
  getResourceById,
  getResourceForDetail,
  createResource,
  updateResource,
  updateStatus,
  deleteResource,
  toggleFavorite,
  getResourceCount,
  getDomainBreakdown,
  getRecentResources,
  getFavoriteResources,
  getPublicResources,
  getResourcesForUser,
  getPublicResourcesByUser,
  getUserVisibilityStats,
  getTotalResourceCount,
  getPendingResourceCount,
  getResourcesByStatus,
  getRecentPending,
  getAllResourcesForAdmin,
  deleteResourceByAdmin,
};
