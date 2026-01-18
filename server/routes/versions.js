const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const {
  getRecipeVersions,
  getVersion
} = require('../services/firestoreService');

// Helper to get userId from authenticated request
function getUserId(req) {
  return req.user.uid;
}

// Apply authentication to all routes
router.use(authenticateUser);

// Get all versions for a recipe
router.get('/recipe/:recipeId', asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const userId = getUserId(req);
  
  const versions = await getRecipeVersions(userId, recipeId);
  res.json(versions);
}));

// Get specific version
router.get('/:recipeId/:versionId', asyncHandler(async (req, res) => {
  const { recipeId, versionId } = req.params;
  const userId = getUserId(req);
  
  const version = await getVersion(userId, recipeId, versionId);
  
  if (!version) {
    throw createError('Version not found', 404);
  }
  
  res.json(version);
}));

// Compare two versions
router.get('/compare/:recipeId/:version1/:version2', asyncHandler(async (req, res) => {
  const { recipeId, version1, version2 } = req.params;
  const userId = getUserId(req);
  
  const v1 = await getVersion(userId, recipeId, version1);
  const v2 = await getVersion(userId, recipeId, version2);
  
  if (!v1 || !v2) {
    throw createError('One or both versions not found', 404);
  }
  
  res.json({ version1: v1, version2: v2 });
}));

module.exports = router;

