import { onAuthStateChanged } from "firebase/auth";
import {
  resolveTenantByUid,
  useTenantAdminSession,
} from "~/composables/useTenantAdminSession";

export default defineNuxtPlugin(() => {
  const { $auth, $db } = useNuxtApp();
  const session = useTenantAdminSession();

  onAuthStateChanged($auth as any, async (user) => {
    session.firebaseUser.value = user;
    session.tenantError.value = "";

    if (!user) {
      session.tenant.value = null;
      return;
    }

    try {
      session.tenantLoading.value = true;
      const t = await resolveTenantByUid($db as any, user.uid);
      session.tenant.value = t;
      if (!t)
        session.tenantError.value =
          "このユーザーに紐づくテナントが見つかりませんでした";
    } catch (e) {
      console.error(e);
      session.tenant.value = null;
      session.tenantError.value = "テナント情報の取得に失敗しました";
    } finally {
      session.tenantLoading.value = false;
    }
  });
});
