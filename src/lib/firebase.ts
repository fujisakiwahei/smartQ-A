import { initializeApp, getApps, getApp } from "firebase/app";

// Nuxt の Runtime Config を利用して初期化する関数
export const initFirebase = () => {
  // 既に初期化されている場合は既存のアプリを返す
  if (getApps().length > 0) {
    return getApp();
  }

  // Nuxt の useRuntimeConfig() を使用して、nuxt.config.ts で定義した公開設定を取得します
  const config = useRuntimeConfig().public;

  const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId,
  };

  // projectId などが正しく取得できているかチェック（デバッグ用）
  if (!firebaseConfig.projectId) {
    throw new Error("Firebase Project ID が設定されていません。nuxt.config.ts または .env を確認してください。");
  }

  return initializeApp(firebaseConfig);
};
