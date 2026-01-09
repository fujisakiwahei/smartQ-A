export default defineNuxtRouteMiddleware((to, from) => {
  const { isDeveloper, isReady } = useAdminSession();

  // 初期化が終わっていない場合は、初期化を待つために何もしない
  if (!isReady.value) return;

  // 開発者でない場合は、トップページへリダイレクト
  if (!isDeveloper.value) {
    return navigateTo("/");
  }
});
