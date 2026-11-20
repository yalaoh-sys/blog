import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// NEXT_PUBLIC_* 는 정적 참조여야 번들에 인라인된다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isClientConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId);
}

function app() {
  return getApps().length ? getApp() : initializeApp(config);
}

export const clientAuth = () => getAuth(app());
export const clientStorage = () => getStorage(app());
