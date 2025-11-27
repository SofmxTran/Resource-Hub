const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    default: null,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    required: true,
    enum: ['FILE', 'LINK', 'POST'],
  },
  filePath: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
  purpose: {
    type: String,
    default: null,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  imagePath: {
    type: String,
    default: null,
  },
  guideText: {
    type: String,
    default: null,
  },
  content: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Indexes for performance
resourceSchema.index({ userId: 1 });
resourceSchema.index({ domainId: 1 });
resourceSchema.index({ status: 1, isPublic: 1 });
resourceSchema.index({ createdAt: -1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;

