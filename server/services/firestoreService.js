/**
 * Firestore Service Layer
 * Handles all database operations for Recipe Hub
 */

const { getDb, getAdmin } = require('../config/firebase');
const admin = getAdmin();
const FieldValue = admin.firestore.FieldValue;

/**
 * Get a reference to a user's collection
 * @param {string} userId - User ID
 * @param {string} collection - Collection name ('books' or 'recipes')
 * @returns {FirebaseFirestore.CollectionReference}
 */
function getUserCollection(userId, collection) {
  const db = getDb();
  return db.collection('users').doc(userId).collection(collection);
}

// ============================================================================
// BOOK OPERATIONS
// ============================================================================

/**
 * Get all books for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of book objects
 */
async function getAllBooks(userId) {
  const booksRef = getUserCollection(userId, 'books');
  const snapshot = await booksRef.orderBy('name').get();
  
  // Filter out archived books in JavaScript to avoid needing a composite index
  const books = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(book => !book.archived);
  return books;
}

/**
 * Get a specific book
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<Object|null>} Book object or null if not found
 */
async function getBook(userId, bookId) {
  const bookRef = getUserCollection(userId, 'books').doc(bookId);
  const doc = await bookRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/**
 * Create a new book
 * @param {string} userId - User ID
 * @param {Object} bookData - Book data
 * @returns {Promise<Object>} Created book with ID
 */
async function createBook(userId, bookData) {
  const db = getDb();
  const booksRef = getUserCollection(userId, 'books');
  
  const newBook = {
    userId,
    name: bookData.name,
    description: bookData.description || '',
    image: bookData.image || '📖',
    recipeIds: [],
    recipeCount: 0,
    isPublic: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  // Use provided ID or auto-generate
  let bookRef;
  if (bookData.id) {
    bookRef = booksRef.doc(bookData.id);
    await bookRef.set(newBook);
  } else {
    bookRef = await booksRef.add(newBook);
  }

  return { id: bookRef.id, ...newBook };
}

/**
 * Update a book
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated book
 */
async function updateBook(userId, bookId, updates) {
  const bookRef = getUserCollection(userId, 'books').doc(bookId);
  const doc = await bookRef.get();
  
  if (!doc.exists) {
    throw new Error('Book not found');
  }

  const allowedUpdates = {
    name: updates.name,
    description: updates.description,
    image: updates.image,
    updatedAt: FieldValue.serverTimestamp()
  };

  // Remove undefined fields
  Object.keys(allowedUpdates).forEach(key => 
    allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  await bookRef.update(allowedUpdates);
  const updated = await bookRef.get();
  return { id: updated.id, ...updated.data() };
}

/**
 * Delete a book (marks as archived)
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<void>}
 */
async function deleteBook(userId, bookId) {
  const db = getDb();
  const batch = db.batch();

  // Get the book to find its recipes
  const bookRef = getUserCollection(userId, 'books').doc(bookId);
  const bookDoc = await bookRef.get();
  
  if (!bookDoc.exists) {
    throw new Error('Book not found');
  }

  const book = bookDoc.data();

  // Remove this bookId from all recipes that contain it
  const recipesRef = getUserCollection(userId, 'recipes');
  const recipesSnapshot = await recipesRef
    .where('bookId', '==', bookId)
    .get();

  recipesSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      bookId: '',
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  // Mark book as archived instead of deleting
  batch.update(bookRef, {
    archived: true,
    archivedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  await batch.commit();
}

// ============================================================================
// RECIPE OPERATIONS
// ============================================================================

/**
 * Get all recipes for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, orderBy, etc.)
 * @returns {Promise<Array>} Array of recipe objects
 */
async function getAllRecipes(userId, options = {}) {
  let query = getUserCollection(userId, 'recipes');
  
  // Order by the specified field or default to name
  const orderByField = options.orderBy || 'name';
  const orderDirection = options.order || 'asc';
  query = query.orderBy(orderByField, orderDirection);

  const snapshot = await query.get();
  
  // Filter out archived recipes in JavaScript to avoid needing a composite index
  let recipes = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(recipe => !recipe.archived);
  
  // Apply limit after filtering if specified
  if (options.limit) {
    recipes = recipes.slice(0, options.limit);
  }

  return recipes;
}

/**
 * Get recipes for a specific book
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Promise<Array>} Array of recipe objects
 */
async function getRecipesByBook(userId, bookId) {
  const recipesRef = getUserCollection(userId, 'recipes');
  const snapshot = await recipesRef
    .where('bookId', '==', bookId)
    .get();
  
  // Filter out archived recipes and sort in JavaScript to avoid needing a composite index
  const recipes = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(recipe => !recipe.archived);
  return recipes.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Get a specific recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object|null>} Recipe object or null if not found
 */
async function getRecipe(userId, recipeId) {
  const recipeRef = getUserCollection(userId, 'recipes').doc(recipeId);
  const doc = await recipeRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/**
 * Create a new recipe
 * @param {string} userId - User ID
 * @param {Object} recipeData - Recipe data
 * @returns {Promise<Object>} Created recipe with ID
 */
async function createRecipe(userId, recipeData) {
  const db = getDb();
  const recipesRef = getUserCollection(userId, 'recipes');
  
  const newRecipe = {
    userId,
    name: recipeData.name,
    description: recipeData.description || '',
    cookTime: recipeData.cookTime || '',
    servings: recipeData.servings || 0,
    ingredients: recipeData.ingredients || [],
    instructions: recipeData.instructions || [],
    bookId: recipeData.bookId || '',
    originalSource: recipeData.originalSource || '',
    viewCount: 0,
    currentVersion: 1,
    isPublic: false,
    tags: extractTags(recipeData.ingredients),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  // Use provided ID or auto-generate
  let recipeRef;
  if (recipeData.id) {
    recipeRef = recipesRef.doc(recipeData.id);
    await recipeRef.set(newRecipe);
  } else {
    recipeRef = await recipesRef.add(newRecipe);
  }

  // Create initial version
  await createVersion(userId, recipeRef.id, {
    version: 1,
    author: recipeData.author || 'User',
    notes: 'Initial version',
    data: {
      name: newRecipe.name,
      description: newRecipe.description,
      cookTime: newRecipe.cookTime,
      servings: newRecipe.servings,
      ingredients: newRecipe.ingredients,
      instructions: newRecipe.instructions,
      originalSource: newRecipe.originalSource,
      viewCount: 0
    }
  });

  // Update book recipe count and IDs
  if (newRecipe.bookId) {
    const bookRef = getUserCollection(userId, 'books').doc(newRecipe.bookId);
    await bookRef.update({
      recipeIds: FieldValue.arrayUnion(recipeRef.id),
      recipeCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  return { id: recipeRef.id, ...newRecipe };
}

/**
 * Update a recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @param {Object} updates - Fields to update
 * @param {Object} versionInfo - Version information (author, notes)
 * @returns {Promise<Object>} Updated recipe
 */
async function updateRecipe(userId, recipeId, updates, versionInfo = {}) {
  const db = getDb();
  const recipeRef = getUserCollection(userId, 'recipes').doc(recipeId);
  const doc = await recipeRef.get();
  
  if (!doc.exists) {
    throw new Error('Recipe not found');
  }

  const currentRecipe = doc.data();
  const newVersion = (currentRecipe.currentVersion || 1) + 1;

  // Prepare updates
  const recipeUpdates = {
    updatedAt: FieldValue.serverTimestamp(),
    currentVersion: newVersion
  };

  // Only update provided fields
  const allowedFields = ['name', 'description', 'cookTime', 'servings', 'ingredients', 'instructions', 'bookId', 'originalSource'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      recipeUpdates[field] = updates[field];
    }
  });

  // Update tags if ingredients changed
  if (updates.ingredients) {
    recipeUpdates.tags = extractTags(updates.ingredients);
  }

  // Handle bookId changes
  const oldBookId = currentRecipe.bookId || '';
  const newBookId = updates.bookId !== undefined ? updates.bookId : oldBookId;
  
  if (oldBookId !== newBookId) {
    // Remove from old book
    if (oldBookId) {
      const oldBookRef = getUserCollection(userId, 'books').doc(oldBookId);
      await oldBookRef.update({
        recipeIds: FieldValue.arrayRemove(recipeId),
        recipeCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // Add to new book
    if (newBookId) {
      const newBookRef = getUserCollection(userId, 'books').doc(newBookId);
      await newBookRef.update({
        recipeIds: FieldValue.arrayUnion(recipeId),
        recipeCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  }

  // Update the recipe
  await recipeRef.update(recipeUpdates);

  // Create new version
  const updatedRecipe = { ...currentRecipe, ...recipeUpdates };
  await createVersion(userId, recipeId, {
    version: newVersion,
    author: versionInfo.author || 'User',
    notes: versionInfo.notes || 'Updated recipe',
    data: {
      name: updatedRecipe.name,
      description: updatedRecipe.description,
      cookTime: updatedRecipe.cookTime,
      servings: updatedRecipe.servings,
      ingredients: updatedRecipe.ingredients,
      instructions: updatedRecipe.instructions,
      originalSource: updatedRecipe.originalSource,
      viewCount: updatedRecipe.viewCount
    }
  });

  const updated = await recipeRef.get();
  return { id: updated.id, ...updated.data() };
}

/**
 * Delete a recipe (marks as archived)
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<void>}
 */
async function deleteRecipe(userId, recipeId) {
  const db = getDb();
  const recipeRef = getUserCollection(userId, 'recipes').doc(recipeId);
  const doc = await recipeRef.get();
  
  if (!doc.exists) {
    throw new Error('Recipe not found');
  }

  const recipe = doc.data();
  const batch = db.batch();

  // Remove recipe from book
  if (recipe.bookId) {
    const bookRef = getUserCollection(userId, 'books').doc(recipe.bookId);
    batch.update(bookRef, {
      recipeIds: FieldValue.arrayRemove(recipeId),
      recipeCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  // Mark recipe as archived instead of deleting
  batch.update(recipeRef, {
    archived: true,
    archivedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  await batch.commit();
}

/**
 * Increment recipe view count
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<number>} New view count
 */
async function incrementViewCount(userId, recipeId) {
  const recipeRef = getUserCollection(userId, 'recipes').doc(recipeId);
  await recipeRef.update({
    viewCount: FieldValue.increment(1)
  });
  
  const doc = await recipeRef.get();
  return doc.data().viewCount;
}

/**
 * Search recipes by name
 * @param {string} userId - User ID
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching recipes
 */
async function searchRecipes(userId, searchTerm) {
  const recipesRef = getUserCollection(userId, 'recipes');
  const lowerTerm = searchTerm.toLowerCase();
  
  // Firestore doesn't support full-text search natively
  // This is a simple prefix search - for production, consider Algolia or ElasticSearch
  const snapshot = await recipesRef
    .where('name', '>=', lowerTerm)
    .where('name', '<=', lowerTerm + '\uf8ff')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================================================
// VERSION OPERATIONS
// ============================================================================

/**
 * Create a new version for a recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @param {Object} versionData - Version data
 * @returns {Promise<Object>} Created version
 */
async function createVersion(userId, recipeId, versionData) {
  const versionsRef = getUserCollection(userId, 'recipes')
    .doc(recipeId)
    .collection('versions');

  const newVersion = {
    recipeId,
    userId,
    version: versionData.version,
    timestamp: FieldValue.serverTimestamp(),
    author: versionData.author,
    notes: versionData.notes,
    data: versionData.data
  };

  const versionRef = await versionsRef.add(newVersion);
  return { id: versionRef.id, ...newVersion };
}

/**
 * Get all versions for a recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Array>} Array of version objects
 */
async function getRecipeVersions(userId, recipeId) {
  const versionsRef = getUserCollection(userId, 'recipes')
    .doc(recipeId)
    .collection('versions');
  
  const snapshot = await versionsRef.orderBy('version', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a specific version
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @param {string} versionId - Version ID
 * @returns {Promise<Object|null>} Version object or null if not found
 */
async function getVersion(userId, recipeId, versionId) {
  const versionRef = getUserCollection(userId, 'recipes')
    .doc(recipeId)
    .collection('versions')
    .doc(versionId);
  
  const doc = await versionRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Create or update user profile
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 * @returns {Promise<Object>} User profile
 */
async function createOrUpdateUser(userId, userData) {
  const db = getDb();
  const userRef = db.collection('users').doc(userId);
  
  const userDoc = {
    userId,
    email: userData.email,
    displayName: userData.displayName || '',
    updatedAt: FieldValue.serverTimestamp()
  };

  const doc = await userRef.get();
  if (!doc.exists) {
    userDoc.createdAt = FieldValue.serverTimestamp();
  }

  await userRef.set(userDoc, { merge: true });
  const updated = await userRef.get();
  return { id: updated.id, ...updated.data() };
}

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile or null if not found
 */
async function getUser(userId) {
  const db = getDb();
  const userRef = db.collection('users').doc(userId);
  const doc = await userRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract tags from ingredients for search
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Array} Array of normalized ingredient names
 */
function extractTags(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return [];
  
  return ingredients
    .map(ing => ing.name?.toLowerCase().trim())
    .filter(name => name && name.length > 0);
}

module.exports = {
  // Books
  getAllBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  
  // Recipes
  getAllRecipes,
  getRecipesByBook,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  incrementViewCount,
  searchRecipes,
  
  // Versions
  createVersion,
  getRecipeVersions,
  getVersion,
  
  // Users
  createOrUpdateUser,
  getUser,
  
  // Utilities
  FieldValue
};
