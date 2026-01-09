import { firebaseAdmin, auth } from "../lib/firebase-admin";

export default defineEventHandler(async (event) => {
  try {
    // Admin SDKの状態を確認
    const appName = firebaseAdmin.name;

    // Authが動作するか軽くチェック（ユーザー一覧の取得などを試みる）
    // 注意: ユーザーが一人もいない場合も成功します
    const listUsers = await auth.listUsers(1);

    return {
      status: "success",
      message: "Firebase Admin SDK initialized successfully",
      appName: appName,
      userCount: listUsers.users.length,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message,
      stack: error.stack,
    };
  }
});
