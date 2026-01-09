import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const useAdminFirestore = () => {
  const apps = getApps();

  if (!apps.length) {
    // In production, we would use proper credentials
    // For now/local dev, we might rely on default Google credentials or a service account path
    // if process.env.GOOGLE_APPLICATION_CREDENTIALS is set, initializeApp() works automatically.
    // Or we can pass config object if we have env vars for it.

    // For this implementation task, let's assume standard init
    initializeApp();
  }

  return getFirestore();
};
