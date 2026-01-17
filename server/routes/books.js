const express = require('express');
const router = express.Router();
const { readJsonFile, writeJsonFile, getDataPath } = require('../utils/fileUtils');
const { validateBook } = require('../utils/validators');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const booksPath = getDataPath('books.json');
const recipesPath = getDataPath('recipes.json');

// Get all recipe books
router.get('/', asyncHandler(async (req, res) => {
  const books = await readJsonFile(booksPath);
  res.json(books);
}));

// Get recipes for a specific book
router.get('/:bookId', asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const allRecipes = await readJsonFile(recipesPath);
  const bookRecipes = allRecipes[bookId];
  
  if (!bookRecipes) {
    throw createError('Recipe book not found', 404);
  }
  
  res.json(bookRecipes);
}));

// Create a new recipe book (currently just returns success without persisting)
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  
  // Validate request body
  const validation = validateBook(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  // TODO: Replace with actual book creation logic
  // For now, return first book ID as test data
  const books = await readJsonFile(booksPath);
  const testBookId = books.length > 0 ? books[0].id : 'italian';
  
  res.status(201).json({ 
    message: `Recipe book "${name}" has been added successfully!`,
    success: true,
    id: testBookId
  });
}));

// Update an existing recipe book
router.put('/:bookId', asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const { bookId } = req.params;
  
  // Validate request body
  const validation = validateBook(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  // Read existing books
  const books = await readJsonFile(booksPath);
  
  // Find the book to update
  const bookIndex = books.findIndex(b => b.id === bookId);
  
  if (bookIndex === -1) {
    throw createError('Recipe book not found', 404);
  }
  
  // Update the book
  books[bookIndex] = {
    ...books[bookIndex],
    name,
    description,
    image
  };
  
  // Write back to file
  await writeJsonFile(booksPath, books);
  
  res.json({ 
    message: `Recipe book "${name}" has been updated successfully!`,
    success: true,
    book: books[bookIndex]
  });
}));

module.exports = router;
