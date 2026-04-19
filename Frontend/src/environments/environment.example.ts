// COPY THIS FILE TO environment.ts AND FILL IN YOUR OWN FIREBASE CREDENTIALS
// DO NOT COMMIT environment.ts TO GIT - IT CONTAINS SENSITIVE API KEYS

export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY_HERE',
    authDomain: 'YOUR_AUTH_DOMAIN_HERE',
    projectId: 'YOUR_PROJECT_ID_HERE',
    storageBucket: 'YOUR_STORAGE_BUCKET_HERE',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID_HERE',
    appId: 'YOUR_APP_ID_HERE'
  },
  api: {
    url: 'http://localhost:5000'
  }
};
