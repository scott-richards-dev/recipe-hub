const express = require('express');
const router = express.Router();
const { readJsonFile, getDataPath } = require('../utils/fileUtils');
const { validateIds } = require('../utils/validators');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const recipesPath = getDataPath('recipes.json');

/**
 * Flatten all recipes from all books into a single array
 * @param {Object} allRecipes - All recipes organized by book
 * @returns {Array} Flattened array of recipes
 */
function flattenRecipes(allRecipes) {
  const recipeList = [];
  for (const bookId in allRecipes) {
    recipeList.push(...allRecipes[bookId]);
  }
  return recipeList;
}

// Get multiple recipe details for comparison (expects comma-separated recipe IDs)
router.get('/', asyncHandler(async (req, res) => {
  const recipeIds = req.query.recipes;
  
  // Validate recipe IDs
  const validation = validateIds(recipeIds);
  if (!validation.isValid) {
    throw createError(validation.error, 400);
  }

  const allRecipes = await readJsonFile(recipesPath);
  const recipeList = flattenRecipes(allRecipes);
  
  const comparisonData = validation.ids
    .map(id => recipeList.find(r => r.id === id))
    .filter(recipe => recipe !== undefined);

  if (comparisonData.length === 0) {
    throw createError('No valid recipes found', 404);
  }

  res.json(comparisonData);
}));

module.exports = router;
