import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initFirebase } from "../../src/lib/firebase";

export default defineNuxtPlugin((nuxtApp) => {
  const app = initFirebase();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const { adminUser, isReady } = useAdminSession();

  // 認証状態の変更を監視
  onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        // UIDをドキュメントIDとしてテナント情報を取得
        const tenantDoc = await getDoc(doc(db, "tenants", fbUser.uid));

        if (tenantDoc.exists()) {
          const data = tenantDoc.data();
          adminUser.value = {
            user_id: fbUser.uid,
            email: fbUser.email || "",
            tenant_id: fbUser.uid,
            is_developer: !!data.is_developer,
          };
        } else {
          // テナント情報がない場合はログアウトさせるか、エラー状態にする
          adminUser.value = null;
        }
      } catch (error) {
        console.error("テナント情報の取得に失敗しました:", error);
        adminUser.value = null;
      }
    } else {
      adminUser.value = null;
    }

    // 初回の確認が完了
    if (!isReady.value) {
      isReady.value = true;
    }
  });

  return {
    provide: {
      auth,
    },
  };
});
