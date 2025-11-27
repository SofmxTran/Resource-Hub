const mongoose = require('mongoose');

const resourceVoteSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  value: {
    type: Number,
    required: true,
    default: 1,
  },
}, {
  timestamps: true,
});

// Unique compound index to prevent duplicate votes
resourceVoteSchema.index({ resourceId: 1, userId: 1 }, { unique: true });

// Indexes for performance
resourceVoteSchema.index({ resourceId: 1 });
resourceVoteSchema.index({ userId: 1 });

const ResourceVote = mongoose.model('ResourceVote', resourceVoteSchema);

module.exports = ResourceVote;

