/**
 * Validate book creation/update data
 * @param {Object} bookData - Book data to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateBook(bookData) {
  const errors = [];
  const { name, description, image } = bookData;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }

  if (!image || typeof image !== 'string' || image.trim() === '') {
    errors.push('image is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate recipe creation/update data
 * @param {Object} recipeData - Recipe data to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateRecipe(recipeData) {
  const errors = [];
  const { name, ingredients, instructions, bookId } = recipeData;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('name is required and must be a non-empty string');
  }

  if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
    errors.push('a book must be assigned to the recipe');
  }

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    errors.push('at least one ingredient is required');
  } else {
    // Validate ingredients format
    const hasIngredientSections = ingredients[0]?.section !== undefined;
    if (hasIngredientSections) {
      for (const section of ingredients) {
        if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
          errors.push('each ingredient section must have at least one item');
          break;
        }
      }
    }
  }

  if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
    errors.push('at least one instruction is required');
  } else {
    // Validate instructions format
    const hasInstructionSections = instructions[0]?.section !== undefined;
    if (hasInstructionSections) {
      for (const section of instructions) {
        if (!section.items || !Array.isArray(section.items) || section.items.length === 0) {
          errors.push('each instruction section must have at least one item');
          break;
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate array of IDs
 * @param {string|string[]} ids - IDs to validate
 * @returns {Object} { isValid: boolean, ids: string[], error: string }
 */
function validateIds(ids) {
  if (!ids) {
    return { isValid: false, ids: [], error: 'No IDs provided' };
  }

  const idsArray = Array.isArray(ids) ? ids : ids.split(',');
  const trimmedIds = idsArray.map(id => id.trim()).filter(id => id);

  if (trimmedIds.length === 0) {
    return { isValid: false, ids: [], error: 'No valid IDs provided' };
  }

  return { isValid: true, ids: trimmedIds, error: null };
}

module.exports = {
  validateBook,
  validateRecipe,
  validateIds
};
