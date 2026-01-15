const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const recipesPath = path.join(__dirname, '../data/recipes.json');

// Get specific recipe details
router.get('/:recipeId', async (req, res) => {
  try {
    const data = await fs.readFile(recipesPath, 'utf8');
    const allRecipes = JSON.parse(data);
    
    // Find recipe across all books
    let recipe = null;
    for (const bookId in allRecipes) {
      const foundRecipe = allRecipes[bookId].find(r => r.id === req.params.recipeId);
      if (foundRecipe) {
        recipe = foundRecipe;
        break;
      }
    }
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read recipe' });
  }
});

module.exports = router;
