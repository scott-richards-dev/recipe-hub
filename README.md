# Recipe Hub

A recipe versioning site with history tracking and user authentication. Organize recipes into cookbooks and track changes over time with version history.

## Tech Stack

- **Backend**: Node.js, Express.js, Firebase Admin SDK
- **Frontend**: HTML5, CSS, Alpine.js, JavaScript
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication with Google OAuth

## Features

- 🔐 Secure Google sign-in authentication
- 📚 Personal recipe books and organization
- 📝 Version history tracking for recipes
- 🔍 Search and browse recipes
- 👥 User-specific data (with future sharing support)
- ☁️ Cloud storage with Firestore
- 📱 Responsive design

## Quick Setup

### Prerequisites
- Node.js (v16+)
- Google Firebase account

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase Authentication**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Google Authentication (Authentication → Sign-in method)
   - Register your web app and get the Firebase config
   - Generate a service account key (Project Settings → Service Accounts)
   - Save the JSON file as `serviceAccountKey.json` in project root

3. **Configure Frontend**
   - Edit `public/js/firebase-config.js`
   - Replace placeholder values with your Firebase config from the web app

4. **Set up environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add:
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-project-id
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs at http://localhost:3000

See [FIREBASE_AUTH_SETUP.md](./FIREBASE_AUTH_SETUP.md) for detailed authentication setup instructions.

## API Endpoints

All API endpoints require authentication via Firebase ID token in the `Authorization` header:
```
Authorization: Bearer <firebase-id-token>
```

**Books**
- `GET /api/books` - Get all recipe books for authenticated user
- `GET /api/books/:bookId` - Get recipes in a book
- `POST /api/books` - Create a book
- `PUT /api/books/:bookId` - Update a book
- `DELETE /api/books/:bookId` - Delete a book

**Recipes**
- `GET /api/recipes` - Get all recipes for authenticated user
- `GET /api/recipes/:recipeId` - Get a recipe
- `POST /api/recipes` - Create a recipe
- `PUT /api/recipes/:recipeId` - Update a recipe
- `DELETE /api/recipes/:recipeId` - Delete a recipe

**Versions**
- `GET /api/versions/recipe/:recipeId` - Get recipe version history
- `GET /api/versions/:recipeId/:versionId` - Get specific version

## Authentication Flow

1. User clicks "Continue with Google" on landing page
2. Firebase handles Google OAuth popup
3. Frontend receives ID token
4. All API requests include token in Authorization header
5. Backend verifies token with Firebase Admin SDK
6. User data is scoped to their Firebase UID

## Documentation

- [FIREBASE_AUTH_SETUP.md](./FIREBASE_AUTH_SETUP.md) - Authentication setup guide
- [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) - Firestore setup guide
- [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) - Database schema
- [AZURE_FIREBASE_CONFIG.md](./AZURE_FIREBASE_CONFIG.md) - Azure deployment

## Security

- All data is scoped to authenticated users
- Firebase security rules ensure users can only access their own data
- Service account keys should never be committed to version control
- Frontend Firebase config is public but protected by domain restrictions

## Future Features

The authentication system supports future features like:
- User profiles
- Following other users
- Sharing recipes publicly or with specific users
- Viewing and cloning other users' recipes
- Collaborative recipe books

## License

ISC

