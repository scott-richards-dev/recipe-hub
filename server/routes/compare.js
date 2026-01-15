const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const recipesPath = path.join(__dirname, '../data/recipes.json');

// Get multiple recipe details for comparison (expects comma-separated recipe IDs)
router.get('/', async (req, res) => {
  const recipeIds = req.query.recipes ? req.query.recipes.split(',') : [];
  
  if (recipeIds.length === 0) {
    return res.status(400).json({ error: 'No recipe IDs provided' });
  }

  try {
    const data = await fs.readFile(recipesPath, 'utf8');
    const allRecipes = JSON.parse(data);
    
    // Flatten all recipes from all books
    const recipeList = [];
    for (const bookId in allRecipes) {
      recipeList.push(...allRecipes[bookId]);
    }
    
    const comparisonData = recipeIds
      .map(id => recipeList.find(r => r.id === id.trim()))
      .filter(recipe => recipe !== undefined);

    if (comparisonData.length === 0) {
      return res.status(404).json({ error: 'No valid recipes found' });
    }

    res.json(comparisonData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read recipes' });
  }
});

module.exports = router;
