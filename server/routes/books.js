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

module.exports = router;
