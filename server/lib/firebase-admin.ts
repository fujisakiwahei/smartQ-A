//Firebase Admin SDKの初期化及び、Firebase Auth インスタンスを取得するコンポーネント

import { initializeApp, cert, getApps } from "firebase-admin/app"; //Firebase Admin SDKのインポート
import { getAuth } from "firebase-admin/auth"; //Firebase Admin SDKのインポート

const privateKey = process.env.FIREBASE_PRIVATE_KEY; //秘密鍵の格納
if (!privateKey) {
  //秘密鍵が無ければエラー処理
  throw new Error("FIREBASE_PRIVATE_KEY is not defined");
}

export const firebaseAdmin = //Firebase Admin SDKの初期化処理
  getApps()[0] ?? //Firebase Admin SDKが初期化されていればそれを利用、初期化されていなければ初期化処理
  initializeApp({
    //Firebase Admin SDKを初期化
    credential: cert({
      //以下内容を持って、初期化
      projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, "\n"), // 改行文字を適切に処理
    }),
  });

export const auth = getAuth(); //Firebase Authenticationを初期化し、サービス利用が出来るようにする
