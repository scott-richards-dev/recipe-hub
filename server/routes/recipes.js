const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { validateRecipe } = require('../utils/validators');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const {
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  incrementViewCount,
  searchRecipes,
  getAllRecipes
} = require('../services/firestoreService');

// Helper to get userId from authenticated request
function getUserId(req) {
  return req.user.uid;
}

// Apply authentication to all routes
router.use(authenticateUser);

// Get all recipes (optional, for search/browse)
router.get('/', asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { search, limit, orderBy } = req.query;
  
  let recipes;
  if (search) {
    recipes = await searchRecipes(userId, search);
  } else {
    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (orderBy) options.orderBy = orderBy;
    recipes = await getAllRecipes(userId, options);
  }
  
  res.json(recipes);
}));

// Get specific recipe details
router.get('/:recipeId', asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const userId = getUserId(req);
  
  const recipe = await getRecipe(userId, recipeId);
  
  if (!recipe) {
    throw createError('Recipe not found', 404);
  }
  
  // Increment view count
  await incrementViewCount(userId, recipeId);
  
  res.json(recipe);
}));

// Create a new recipe
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, cookTime, servings, ingredients, instructions, bookId, originalSource, id } = req.body;
  const userId = getUserId(req);
  
  // Validate request body
  const validation = validateRecipe(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  const newRecipe = await createRecipe(userId, {
    name,
    description,
    cookTime,
    servings,
    ingredients,
    instructions,
    bookId,
    originalSource,
    id,
    author: req.body.author || 'User'
  });
  
  res.status(201).json({ 
    message: `Recipe "${name}" has been added successfully!`,
    success: true,
    id: newRecipe.id,
    recipe: newRecipe
  });
}));

// Update an existing recipe
router.put('/:recipeId', asyncHandler(async (req, res) => {
  const { name, description, cookTime, servings, ingredients, instructions, bookId, originalSource, versionNotes } = req.body;
  const { recipeId } = req.params;
  const userId = getUserId(req);
  
  // Validate request body
  const validation = validateRecipe(req.body);
  if (!validation.isValid) {
    throw createError(validation.errors.join(', '), 400);
  }
  
  try {
    const updatedRecipe = await updateRecipe(
      userId,
      recipeId,
      { name, description, cookTime, servings, ingredients, instructions, bookId, originalSource },
      {
        author: req.body.author || 'User',
        notes: versionNotes || 'Updated recipe'
      }
    );
    
    res.json({ 
      message: `Recipe "${name}" has been updated successfully!`,
      success: true,
      recipe: updatedRecipe
    });
  } catch (error) {
    if (error.message === 'Recipe not found') {
      throw createError('Recipe not found', 404);
    }
    throw error;
  }
}));

// Delete a recipe
router.delete('/:recipeId', asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const userId = getUserId(req);
  
  try {
    await deleteRecipe(userId, recipeId);
    
    res.json({ 
      message: 'Recipe has been deleted successfully!',
      success: true
    });
  } catch (error) {
    if (error.message === 'Recipe not found') {
      throw createError('Recipe not found', 404);
    }
    throw error;
  }
}));

module.exports = router;

