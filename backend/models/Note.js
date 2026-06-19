const mongoose = require('mongoose');

/**
 * Note Schema
 * Defines the structure for notes in MongoDB
 */
const noteSchema = new mongoose.Schema(
  {
    // Note title - required
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    // Note content - required
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    // Optional category/tag
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [30, 'Category cannot exceed 30 characters'],
    },
    // Font style for the note
    fontStyle: {
      type: String,
      enum: ['default', 'serif', 'mono', 'cursive'],
      default: 'default',
    },
    // Pin note to top
    pinned: {
      type: Boolean,
      default: false,
    },
    // Color theme for the note card
    color: {
      type: String,
      default: '#1e1e2e',
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Index for search functionality
noteSchema.index({ title: 'text', content: 'text', category: 'text' });

module.exports = mongoose.model('Note', noteSchema);
