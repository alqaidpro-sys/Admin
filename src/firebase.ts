import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the default Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Firestore using the specific Database ID using robust long polling settings
// This prevents connection streams from being blocked by proxies, firewalls, or sandbox environments
const settings = {
  experimentalForceLongPolling: true
};

const databaseId = (firebaseConfig as any).firestoreDatabaseId;

export const db = databaseId
  ? initializeFirestore(app, settings, databaseId)
  : initializeFirestore(app, settings);

// Initialize standard Auth handler
export const auth = getAuth(app);
