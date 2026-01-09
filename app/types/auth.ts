import { Timestamp } from "firebase/firestore";

/**
 * 管理画面ユーザーの型定義
 */
export interface AdminUser {
  user_id: string; // Firebase UID
  email: string;
  tenant_id: string; // 所属するテナントのID（UIDと同一）
  is_developer: boolean; // 開発者フラグ
  created_at?: Timestamp;
}

/**
 * セッションの状態管理
 */
export interface AuthSession {
  adminUser: AdminUser | null;
  isReady: boolean;
}
