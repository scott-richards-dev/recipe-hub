const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const versionsPath = path.join(__dirname, '../data/versions.json');

// Get all versions for a recipe
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const data = await fs.readFile(versionsPath, 'utf8');
    const versions = JSON.parse(data);
    const recipeVersions = versions.filter(v => v.recipeId === req.params.recipeId);
    res.json(recipeVersions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read versions' });
  }
});

// Get specific version
router.get('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(versionsPath, 'utf8');
    const versions = JSON.parse(data);
    const version = versions.find(v => v.id === req.params.id);
    
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read version' });
  }
});

// Compare two versions
router.get('/compare/:version1/:version2', async (req, res) => {
  try {
    const data = await fs.readFile(versionsPath, 'utf8');
    const versions = JSON.parse(data);
    const v1 = versions.find(v => v.id === req.params.version1);
    const v2 = versions.find(v => v.id === req.params.version2);
    
    if (!v1 || !v2) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({ version1: v1, version2: v2 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

module.exports = router;
