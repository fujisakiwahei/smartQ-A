import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { User } from "firebase/auth";

export type TenantAdminTenant = {
  id: string;
  name?: string;
  theme_color?: string;
};

export const useTenantAdminSession = () => {
  const firebaseUser = useState<User | null>(
    "tenantAdmin.firebaseUser",
    () => null
  );
  const tenant = useState<TenantAdminTenant | null>(
    "tenantAdmin.tenant",
    () => null
  );
  const tenantLoading = useState<boolean>(
    "tenantAdmin.tenantLoading",
    () => false
  );
  const tenantError = useState<string>("tenantAdmin.tenantError", () => "");

  return {
    firebaseUser,
    tenant,
    tenantLoading,
    tenantError,
  };
};

export async function resolveTenantByUid(db: Firestore, uid: string) {
  // まずは要件通り tenant_uid を優先（存在しない環境もあるためフォールバック）
  const tryFields = ["tenant_uid", "admin_uid"];

  for (const field of tryFields) {
    const q = query(
      collection(db, "tenants"),
      where(field, "==", uid),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d?.data() as any;
      return {
        id: d?.id || "",
        name: data?.name,
        theme_color: data?.theme_color,
      } satisfies TenantAdminTenant;
    }
  }

  return null;
}
