const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for performance
domainSchema.index({ name: 1 });

const Domain = mongoose.model('Domain', domainSchema);

module.exports = Domain;

