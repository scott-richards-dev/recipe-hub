const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { validateIds } = require('../utils/validators');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { getRecipe } = require('../services/firestoreService');

// Helper to get userId from authenticated request
function getUserId(req) {
  return req.user.uid;
}

// Apply authentication to all routes
router.use(authenticateUser);

// Get multiple recipe details for comparison (expects comma-separated recipe IDs)
router.get('/', asyncHandler(async (req, res) => {
  const recipeIds = req.query.recipes;
  const userId = getUserId(req);
  
  // Validate recipe IDs
  const validation = validateIds(recipeIds);
  if (!validation.isValid) {
    throw createError(validation.error, 400);
  }

  // Fetch all recipes from Firestore
  const comparisonData = [];
  for (const recipeId of validation.ids) {
    const recipe = await getRecipe(userId, recipeId);
    if (recipe) {
      comparisonData.push(recipe);
    }
  }

  if (comparisonData.length === 0) {
    throw createError('No valid recipes found', 404);
  }

  res.json(comparisonData);
}));

module.exports = router;
