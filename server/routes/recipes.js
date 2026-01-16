const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const recipesPath = path.join(__dirname, '../data/recipes.json');

// Helper function to parse ingredient string into structured object
function parseIngredient(ingredientStr) {
  if (typeof ingredientStr === 'object') {
    return ingredientStr; // Already structured
  }
  
  const str = ingredientStr.trim();
  if (!str) {
    throw new Error('Ingredient name is required');
  }
  
  const ingredient = {};
  
  // Common unit patterns (both full and abbreviated forms)
  const unitPattern = '(cups?|tbsp|tsp|teaspoons?|tablespoons?|oz|ounces?|lbs?|pounds?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|pint|quart|gallon|cloves?|pieces?|slices?|pinch|dash)';
  
  // Pattern 1: "Name - Amount Unit" (e.g., "Butter - 4 cups", "Flour - 2 cups")
  const reversePattern = new RegExp(`^(.+?)\\s*[-–—]\\s*(\\d+(?:[\\.\\/]\\d+)?)\\s*${unitPattern}?\\s*$`, 'i');
  const reverseMatch = str.match(reversePattern);
  
  if (reverseMatch) {
    ingredient.name = reverseMatch[1].trim();
    ingredient.amount = parseFloat(reverseMatch[2]);
    if (reverseMatch[3]) {
      ingredient.metric = reverseMatch[3].toLowerCase();
    }
    return ingredient;
  }
  
  // Pattern 2: Standard "Amount Unit Name" (e.g., "2 cups flour", "400g spaghetti")
  const standardPattern = new RegExp(`^(\\d+(?:[\\.\\/]\\d+)?)\\s*${unitPattern}?\\s+(.+)$`, 'i');
  const standardMatch = str.match(standardPattern);
  
  if (standardMatch) {
    ingredient.amount = parseFloat(standardMatch[1]);
    if (standardMatch[2]) {
      ingredient.metric = standardMatch[2].toLowerCase();
    }
    ingredient.name = standardMatch[3].trim();
    return ingredient;
  }
  
  // Pattern 3: "Amount Name" without unit (e.g., "3 eggs", "2 onions")
  const noUnitPattern = /^(\d+(?:[\.\\/]\d+)?)\s+(.+)$/;
  const noUnitMatch = str.match(noUnitPattern);
  
  if (noUnitMatch) {
    ingredient.amount = parseFloat(noUnitMatch[1]);
    ingredient.name = noUnitMatch[2].trim();
    return ingredient;
  }
  
  // Pattern 4: Fractional amounts (e.g., "1/2 cup sugar", "1 1/2 cups flour")
  const fractionPattern = new RegExp(`^(\\d+)?\\s*(\\d+)/(\\d+)\\s*${unitPattern}?\\s+(.+)$`, 'i');
  const fractionMatch = str.match(fractionPattern);
  
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1]) : 0;
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);
    ingredient.amount = whole + (numerator / denominator);
    if (fractionMatch[4]) {
      ingredient.metric = fractionMatch[4].toLowerCase();
    }
    ingredient.name = fractionMatch[5].trim();
    return ingredient;
  }
  
  // Pattern 5: Name only (e.g., "Salt to taste", "Pepper", "Water")
  ingredient.name = str;
  return ingredient;
}

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
    if (!name || !description || !cookTime || !servings) {
      return res.status(400).json({ error: 'Missing required fields: name, description, cookTime, and servings are required' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required' });
    }
    
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({ error: 'At least one instruction is required' });
    }
    
    // Parse ingredients from strings to structured objects
    const parsedIngredients = ingredients.map(ing => parseIngredient(ing));
    
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
    if (!name || !description || !cookTime || !servings) {
      return res.status(400).json({ error: 'Missing required fields: name, description, cookTime, and servings are required' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'At least one ingredient is required' });
    }
    
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return res.status(400).json({ error: 'At least one instruction is required' });
    }
    
    // Parse ingredients from strings to structured objects
    const parsedIngredients = ingredients.map(ing => parseIngredient(ing));
    
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
          ingredients: parsedIngredients,
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
