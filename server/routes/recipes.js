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

// Create a new recipe (currently just returns success without persisting)
router.post('/', async (req, res) => {
  try {
    const { name, description, cookTime, servings, viewCount, ingredients, instructions } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name is required' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required' });
    }
    
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({ error: 'At least one instruction is required' });
    }
    
    // Validate ingredients format (either flat array or sectioned array)
    const hasIngredientSections = ingredients[0]?.section !== undefined;
    if (hasIngredientSections) {
      // Validate sectioned format
      for (const section of ingredients) {
        if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
          return res.status(400).json({ error: 'Each ingredient section must have at least one item' });
        }
      }
    }
    
    // Validate instructions format (either flat array or sectioned array)
    const hasInstructionSections = instructions[0]?.section !== undefined;
    if (hasInstructionSections) {
      // Validate sectioned format
      for (const section of instructions) {
        if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
          return res.status(400).json({ error: 'Each instruction section must have at least one item' });
        }
      }
    }
    
    // TODO: Replace with actual recipe creation logic
    // For now, return first recipe ID from first book as test data
    const data = await fs.readFile(recipesPath, 'utf8');
    const allRecipes = JSON.parse(data);
    const firstBookId = Object.keys(allRecipes)[0];
    const testRecipeId = allRecipes[firstBookId] && allRecipes[firstBookId].length > 0 
      ? allRecipes[firstBookId][0].id 
      : 'carbonara';
    
    // For now, just return success without persisting the data
    res.status(201).json({ 
      message: `Recipe "${name}" has been added successfully!`,
      success: true,
      id: testRecipeId // Return test ID for redirection
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update an existing recipe
router.put('/:recipeId', async (req, res) => {
  try {
    const { name, description, cookTime, servings, ingredients, instructions, bookIds } = req.body;
    const { recipeId } = req.params;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name is required' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required' });
    }
    
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({ error: 'At least one instruction is required' });
    }
    
    // Validate ingredients format (either flat array or sectioned array)
    const hasIngredientSections = ingredients[0]?.section !== undefined;
    if (hasIngredientSections) {
      // Validate sectioned format
      for (const section of ingredients) {
        if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
          return res.status(400).json({ error: 'Each ingredient section must have at least one item' });
        }
      }
    }
    
    // Validate instructions format (either flat array or sectioned array)
    const hasInstructionSections = instructions[0]?.section !== undefined;
    if (hasInstructionSections) {
      // Validate sectioned format
      for (const section of instructions) {
        if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
          return res.status(400).json({ error: 'Each instruction section must have at least one item' });
        }
      }
    }
    
    // Read all recipes
    const data = await fs.readFile(recipesPath, 'utf8');
    const allRecipes = JSON.parse(data);
    
    // Find and update the recipe across all books
    let recipeFound = false;
    for (const bookId in allRecipes) {
      const recipeIndex = allRecipes[bookId].findIndex(r => r.id === recipeId);
      if (recipeIndex !== -1) {
        // Update the recipe while preserving certain fields
        allRecipes[bookId][recipeIndex] = {
          ...allRecipes[bookId][recipeIndex],
          name,
          description,
          cookTime,
          servings,
          ingredients: ingredients,
          instructions,
          bookIds: bookIds || allRecipes[bookId][recipeIndex].bookIds
        };
        recipeFound = true;
        break;
      }
    }
    
    if (!recipeFound) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Write back to file
    await fs.writeFile(recipesPath, JSON.stringify(allRecipes, null, 2), 'utf8');
    
    res.json({ 
      message: `Recipe "${name}" has been updated successfully!`,
      success: true
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

module.exports = router;
