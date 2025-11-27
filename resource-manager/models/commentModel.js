const mongoose = require('mongoose');
const Comment = require('./Comment');

function toObjectId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  }
  return id;
}

async function getCommentsForResource(resourceId) {
  const comments = await Comment.find({
    resourceId: toObjectId(resourceId),
  })
    .populate('userId', 'username fullName displayName avatarPath')
    .sort({ createdAt: -1 })
    .lean();

  return comments.map((c) => ({
    id: c._id.toString(),
    resource_id: c.resourceId.toString(),
    user_id: c.userId._id.toString(),
    content: c.content,
    rating: c.rating,
    created_at: c.createdAt,
    username: c.userId.username,
    full_name: c.userId.fullName,
    display_name: c.userId.displayName,
    avatar_path: c.userId.avatarPath,
  }));
}

async function createComment({ resourceId, userId, content, rating }) {
  const comment = new Comment({
    resourceId: toObjectId(resourceId),
    userId: toObjectId(userId),
    content,
    rating: rating || null,
  });
  await comment.save();
  return { changes: 1 };
}

async function deleteComment(id, resourceId, userId, isAdmin = false) {
  const match = {
    _id: id,
    resourceId: toObjectId(resourceId),
  };

  if (!isAdmin) {
    match.userId = toObjectId(userId);
  }

  const result = await Comment.deleteOne(match);
  return { changes: result.deletedCount };
}

module.exports = {
  getCommentsForResource,
  createComment,
  deleteComment,
};
