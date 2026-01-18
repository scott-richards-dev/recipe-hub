const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { validateBook } = require('../utils/validators');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const {
  getAllBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getRecipesByBook
} = require('../services/firestoreService');

// Helper to get userId from authenticated request
function getUserId(req) {
  return req.user.uid;
}

// Apply authentication to all routes
router.use(authenticateUser);

// Get all recipe books
router.get('/', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const books = await getAllBooks(userId);
  res.json(books);
}));

// Get recipes for a specific book
router.get('/:bookId', asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userId = getUserId(req);
  
  // Get recipes in this book
  // Note: We don't verify book existence first to avoid race conditions
  // If the book doesn't exist, this will simply return an empty array
  const recipes = await getRecipesByBook(userId, bookId);
  res.json(recipes);
}));

// Create a new recipe book
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, image, id } = req.body;
  const userId = getUserId(req);
  
  // Validate request body
  const validation = validateBook(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  const newBook = await createBook(userId, { name, description, image, id });
  
  res.status(201).json({ 
    message: `Recipe book "${name}" has been added successfully!`,
    success: true,
    id: newBook.id,
    book: newBook
  });
}));

// Update an existing recipe book
router.put('/:bookId', asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const { bookId } = req.params;
  const userId = getUserId(req);
  
  // Validate request body
  const validation = validateBook(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  try {
    const updatedBook = await updateBook(userId, bookId, { name, description, image });
    
    res.json({ 
      message: `Recipe book "${name}" has been updated successfully!`,
      success: true,
      book: updatedBook
    });
  } catch (error) {
    if (error.message === 'Book not found') {
      throw createError('Recipe book not found', 404);
    }
    throw error;
  }
}));

// Delete a recipe book
router.delete('/:bookId', asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userId = getUserId(req);
  
  try {
    await deleteBook(userId, bookId);
    
    res.json({ 
      message: 'Recipe book has been deleted successfully!',
      success: true
    });
  } catch (error) {
    if (error.message === 'Book not found') {
      throw createError('Recipe book not found', 404);
    }
    throw error;
  }
}));

module.exports = router;
