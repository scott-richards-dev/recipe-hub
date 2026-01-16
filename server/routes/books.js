const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const booksPath = path.join(__dirname, '../data/books.json');
const recipesPath = path.join(__dirname, '../data/recipes.json');

// Get all recipe books
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(booksPath, 'utf8');
    const recipeBooks = JSON.parse(data);
    res.json(recipeBooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read books' });
  }
});

// Get recipes for a specific book
router.get('/:bookId', async (req, res) => {
  try {
    const data = await fs.readFile(recipesPath, 'utf8');
    const allRecipes = JSON.parse(data);
    const bookRecipes = allRecipes[req.params.bookId];
    
    if (!bookRecipes) {
      return res.status(404).json({ error: 'Recipe book not found' });
    }
    
    res.json(bookRecipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read recipes' });
  }
});

// Create a new recipe book (currently just returns success without persisting)
router.post('/', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    
    // Validate required fields
    if (!name || !description || !image) {
      return res.status(400).json({ error: 'Missing required fields: name, description, and image are required' });
    }
    
    // TODO: Replace with actual book creation logic
    // For now, return first book ID as test data
    const data = await fs.readFile(booksPath, 'utf8');
    const books = JSON.parse(data);
    const testBookId = books.length > 0 ? books[0].id : 'italian';
    
    // For now, just return success without persisting the data
    res.status(201).json({ 
      message: `Recipe book "${name}" has been added successfully!`,
      success: true,
      id: testBookId // Return test ID for redirection
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Update an existing recipe book
router.put('/:bookId', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const { bookId } = req.params;
    
    // Validate required fields
    if (!name || !description || !image) {
      return res.status(400).json({ error: 'Missing required fields: name, description, and image are required' });
    }
    
    // Read existing books
    const data = await fs.readFile(booksPath, 'utf8');
    const books = JSON.parse(data);
    
    // Find the book to update
    const bookIndex = books.findIndex(b => b.id === bookId);
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Recipe book not found' });
    }
    
    // Update the book
    books[bookIndex] = {
      ...books[bookIndex],
      name,
      description,
      image
    };
    
    // Write back to file
    await fs.writeFile(booksPath, JSON.stringify(books, null, 2), 'utf8');
    
    res.json({ 
      message: `Recipe book "${name}" has been updated successfully!`,
      success: true,
      book: books[bookIndex]
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

module.exports = router;
