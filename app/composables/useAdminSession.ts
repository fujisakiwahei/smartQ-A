import { getAuth, signOut } from "firebase/auth";
import type { AdminUser } from "../types/auth";

export const useAdminSession = () => {
  // ユーザー情報（AdminUser型）
  const adminUser = useState<AdminUser | null>("admin_user", () => null);
  // 初期化完了フラグ
  const isReady = useState<boolean>("admin_session_ready", () => false);

  // 便利な計算プロパティ
  const isLoggedIn = computed(() => !!adminUser.value);
  const isDeveloper = computed(() => !!adminUser.value?.is_developer);

  // ログアウト関数
  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
    adminUser.value = null;
    navigateTo("/login");
  };

  return {
    adminUser,
    isReady,
    isLoggedIn,
    isDeveloper,
    logout,
  };
};
