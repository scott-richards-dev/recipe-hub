const express = require('express');
const router = express.Router();
const { readJsonFile, writeJsonFile, getDataPath } = require('../utils/fileUtils');
const { validateRecipe } = require('../utils/validators');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const recipesPath = getDataPath('recipes.json');

/**
 * Find a recipe across all books
 * @param {Object} allRecipes - All recipes organized by book
 * @param {string} recipeId - Recipe ID to find
 * @returns {Object|null} Found recipe or null
 */
function findRecipeById(allRecipes, recipeId) {
  for (const bookId in allRecipes) {
    const recipe = allRecipes[bookId].find(r => r.id === recipeId);
    if (recipe) {
      return { recipe, bookId };
    }
  }
  return null;
}

// Get specific recipe details
router.get('/:recipeId', asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const allRecipes = await readJsonFile(recipesPath);
  
  const result = findRecipeById(allRecipes, recipeId);
  
  if (!result) {
    throw createError('Recipe not found', 404);
  }
  
  res.json(result.recipe);
}));

// Create a new recipe (currently just returns success without persisting)
router.post('/', asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  // Validate request body
  const validation = validateRecipe(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  // TODO: Replace with actual recipe creation logic
  // For now, return first recipe ID from first book as test data
  const allRecipes = await readJsonFile(recipesPath);
  const firstBookId = Object.keys(allRecipes)[0];
  const testRecipeId = allRecipes[firstBookId]?.[0]?.id || 'carbonara';
  
  res.status(201).json({ 
    message: `Recipe "${name}" has been added successfully!`,
    success: true,
    id: testRecipeId
  });
}));

// Update an existing recipe
router.put('/:recipeId', asyncHandler(async (req, res) => {
  const { name, description, cookTime, servings, ingredients, instructions, bookIds } = req.body;
  const { recipeId } = req.params;
  
  // Validate request body
  const validation = validateRecipe(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  // Read all recipes
  const allRecipes = await readJsonFile(recipesPath);
  
  // Find and update the recipe across all books
  const result = findRecipeById(allRecipes, recipeId);
  
  if (!result) {
    throw createError('Recipe not found', 404);
  }
  
  const { bookId } = result;
  const recipeIndex = allRecipes[bookId].findIndex(r => r.id === recipeId);
  
  // Update the recipe while preserving certain fields
  allRecipes[bookId][recipeIndex] = {
    ...allRecipes[bookId][recipeIndex],
    name,
    description,
    cookTime,
    servings,
    ingredients,
    instructions,
    bookIds: bookIds || allRecipes[bookId][recipeIndex].bookIds
  };
  
  // Write back to file
  await writeJsonFile(recipesPath, allRecipes);
  
  res.json({ 
    message: `Recipe "${name}" has been updated successfully!`,
    success: true
  });
}));

module.exports = router;
