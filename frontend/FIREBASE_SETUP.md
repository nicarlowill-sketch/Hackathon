# Firebase Setup Instructions

This project uses Firebase for authentication, database (Firestore), and analytics. Follow these steps to set up Firebase for your project.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "one-minute-jamaica")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## 2. Add a Web App to Your Firebase Project

1. In your Firebase project dashboard, click the web icon (`</>`)
2. Enter an app nickname (e.g., "one-minute-jamaica-web")
3. Choose whether to set up Firebase Hosting (optional)
4. Click "Register app"
5. Copy the Firebase configuration object

## 3. Configure Environment Variables

1. Create a `.env` file in the `frontend` directory
2. Add the following environment variables with your Firebase configuration values:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Important:** Replace the placeholder values with your actual Firebase configuration values.

## 4. Enable Firebase Services

### Authentication
1. In the Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the authentication methods you want to use (e.g., Email/Password, Google, etc.)

### Firestore Database
1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database

### Analytics (Optional)
1. If you enabled Google Analytics during project creation, it's already set up
2. The measurement ID should be included in your environment variables

## 5. Security Rules (Important for Production)

### Firestore Security Rules
Update your Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Authentication Domain
1. In the Firebase Console, go to "Authentication" > "Settings" > "Authorized domains"
2. Add your production domain when you deploy

## 6. Testing Your Setup

1. Start your development server: `npm start`
2. Check the browser console for "Firebase initialized successfully"
3. If you see errors about missing environment variables, make sure your `.env` file is properly configured

## 7. Troubleshooting

### Common Issues

1. **"Missing Firebase environment variables" error**
   - Make sure your `.env` file exists in the `frontend` directory
   - Verify all required environment variables are set
   - Restart your development server after adding environment variables

2. **Firebase initialization errors**
   - Check that your Firebase configuration values are correct
   - Ensure your Firebase project is active and not deleted
   - Verify that the required Firebase services are enabled

3. **Analytics not working**
   - Make sure `REACT_APP_FIREBASE_MEASUREMENT_ID` is set
   - Analytics only works in production or with proper domain configuration

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth/web/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore/quickstart)

## 8. Production Deployment

Before deploying to production:

1. Update Firestore security rules to be more restrictive
2. Add your production domain to authorized domains in Authentication settings
3. Consider setting up Firebase Hosting for optimal performance
4. Review and update your Firebase project settings and quotas
