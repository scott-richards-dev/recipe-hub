/**
 * Firebase Admin SDK Configuration
 * Initializes Firestore for server-side operations
 */

const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK
 * Uses environment variables for configuration
 */
function initializeFirebase() {
  if (db) {
    return db; // Already initialized
  }

  try {
    // For local development with service account key file
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    // For Azure App Service with environment variables
    else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    // For testing/development without credentials
    else if (process.env.FIRESTORE_EMULATOR_HOST) {
      admin.initializeApp({
        projectId: 'demo-project'
      });
      console.log('Using Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST);
    }
    else {
      throw new Error('Firebase configuration not found. Please set environment variables.');
    }

    db = admin.firestore();
    console.log('✓ Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance
 * @returns {FirebaseFirestore.Firestore} Firestore database instance
 */
function getDb() {
  if (!db) {
    return initializeFirebase();
  }
  return db;
}

/**
 * Get Firebase Admin instance
 * @returns {admin} Firebase Admin instance
 */
function getAdmin() {
  return admin;
}

module.exports = {
  initializeFirebase,
  getDb,
  getAdmin
};
