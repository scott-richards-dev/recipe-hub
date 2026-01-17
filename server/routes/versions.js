const express = require('express');
const router = express.Router();
const { readJsonFile, getDataPath } = require('../utils/fileUtils');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const versionsPath = getDataPath('versions.json');

// Get all versions for a recipe
router.get('/recipe/:recipeId', asyncHandler(async (req, res) => {
  const { recipeId } = req.params;
  const versions = await readJsonFile(versionsPath);
  const recipeVersions = versions.filter(v => v.recipeId === recipeId);
  res.json(recipeVersions);
}));

// Get specific version
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const versions = await readJsonFile(versionsPath);
  const version = versions.find(v => v.id === id);
  
  if (!version) {
    throw createError('Version not found', 404);
  }
  
  res.json(version);
}));

// Compare two versions
router.get('/compare/:version1/:version2', asyncHandler(async (req, res) => {
  const { version1, version2 } = req.params;
  const versions = await readJsonFile(versionsPath);
  
  const v1 = versions.find(v => v.id === version1);
  const v2 = versions.find(v => v.id === version2);
  
  if (!v1 || !v2) {
    throw createError('One or both versions not found', 404);
  }
  
  res.json({ version1: v1, version2: v2 });
}));

module.exports = router;
