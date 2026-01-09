export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  // tenant-admin配下でのみ有効化したいが、各ページで明示的に指定する前提
  const session = useTenantAdminSession();

  // Auth state が確定するまで少し待つ（初回ロード対策）
  if (!session.firebaseUser.value) {
    // すでにログイン済みの場合はcurrentUserが入ってることがある
    const { $auth } = useNuxtApp();
    session.firebaseUser.value = ($auth as any)?.currentUser ?? null;
  }

  if (!session.firebaseUser.value) {
    return navigateTo({
      path: "/tenant-admin/login",
      query: { redirect: to.fullPath },
    });
  }

  // テナント解決済みでない場合、解決が完了するまで待つ
  const waitStart = Date.now();
  while (session.tenantLoading.value && Date.now() - waitStart < 4000) {
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!session.tenant.value) {
    return navigateTo("/tenant-admin/login");
  }

  // URLのtenantIdが本人のものと違う場合は矯正
  const paramTenantId =
    typeof to.params.tenantId === "string" ? to.params.tenantId : "";
  if (
    paramTenantId &&
    session.tenant.value.id &&
    paramTenantId !== session.tenant.value.id
  ) {
    const target = {
      ...to,
      params: { ...to.params, tenantId: session.tenant.value.id },
    };
    return navigateTo(target as any);
  }
});
