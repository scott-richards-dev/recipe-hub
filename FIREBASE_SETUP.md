# Firebase Setup Guide

## Initial Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** (test mode for development)
3. Enable **Google Authentication** in Authentication → Sign-in method

## Local Development

### Frontend Config

Register a web app in Firebase Console and add credentials to `public/js/firebase-config.js`:

1. In Firebase Console: Project Settings → General → Your Apps

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Backend Config

1. In Firebase Console: Project Settings → Service Accounts → Generate New Private Key
2. Save as `serviceAccountKey.json` in project root
3. Create `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id
PORT=3000
NODE_ENV=development
DEFAULT_USER_ID=dev-user
```

4. Start server: `npm run dev`

## Azure Deployment

In Azure Portal: App Service → Configuration → Application settings

Add these variables from your `serviceAccountKey.json`:

| Variable | Example |
|----------|---------|
| `FIREBASE_PROJECT_ID` | `recipe-hub-12345` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxx@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `NODE_ENV` | `production` |
| `DEFAULT_USER_ID` | `dev-user` |

⚠️ Keep quotes and `\n` characters in `FIREBASE_PRIVATE_KEY`

### Add Azure Domain

In Firebase Console: Authentication → Settings → Authorized domains → Add your Azure URL (e.g., `your-app.azurewebsites.net`)

