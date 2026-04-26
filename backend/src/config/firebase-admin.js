import admin from 'firebase-admin';

let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const fs = await import('fs');
  serviceAccount = JSON.parse(
    fs.readFileSync('./firebase-service-account.json', 'utf8')
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const firebaseAuth = admin.auth();