const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

/**
 * GET /api/notes
 * Get all notes with optional search and category filter
 * Query params: search, category
 */
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // Search by title, content, or category
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Get notes sorted by pinned first, then by creation date
    const notes = await Note.find(query).sort({
      pinned: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notes',
      error: error.message,
    });
  }
});

/**
 * GET /api/notes/:id
 * Get a single note by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching note',
      error: error.message,
    });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', async (req, res) => {
  try {
    const { title, content, category, fontStyle, color } = req.body;

    // Create new note
    const note = await Note.create({
      title,
      content,
      category: category || 'General',
      fontStyle: fontStyle || 'default',
      color: color || '#1e1e2e',
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating note',
      error: error.message,
    });
  }
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, content, category, fontStyle, color, pinned } = req.body;

    // Find and update the note
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        category,
        fontStyle,
        color,
        pinned,
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators on update
      }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating note',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/notes/:id/pin
 * Toggle pin status of a note
 */
router.patch('/:id/pin', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    note.pinned = !note.pinned;
    await note.save();

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while toggling pin',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note permanently
 */
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting note',
      error: error.message,
    });
  }
});

/**
 * GET /api/notes/categories/list
 * Get all unique categories
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Note.distinct('category');
    res.json({
      success: true,
      data: ['All', ...categories],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: error.message,
    });
  }
});

module.exports = router;
