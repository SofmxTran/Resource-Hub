const mongoose = require('mongoose');
const ResourceVote = require('./ResourceVote');

function toObjectId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
  }
  return id;
}

async function getVote(resourceId, userId) {
  const vote = await ResourceVote.findOne({
    resourceId: toObjectId(resourceId),
    userId: toObjectId(userId),
  });
  return vote ? vote.toObject() : null;
}

async function addVote(resourceId, userId) {
  try {
    const vote = new ResourceVote({
      resourceId: toObjectId(resourceId),
      userId: toObjectId(userId),
      value: 1,
    });
    await vote.save();
    return { changes: 1 };
  } catch (error) {
    // If duplicate vote (unique index violation), return 0 changes
    if (error.code === 11000) {
      return { changes: 0 };
    }
    throw error;
  }
}

async function removeVote(resourceId, userId) {
  const result = await ResourceVote.deleteOne({
    resourceId: toObjectId(resourceId),
    userId: toObjectId(userId),
  });
  return { changes: result.deletedCount };
}

module.exports = {
  getVote,
  addVote,
  removeVote,
};
