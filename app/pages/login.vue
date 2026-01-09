<script setup lang="ts">
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const email = ref("");
const password = ref("");
const errorMsg = ref("");
const isLoading = ref(false);

const { isLoggedIn, isDeveloper } = useAdminSession();

// すでにログインしている場合はリダイレクト
watchEffect(() => {
  if (isLoggedIn.value) {
    if (isDeveloper.value) {
      navigateTo("/developer");
    } else {
      navigateTo("/");
    }
  }
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = "メールアドレスとパスワードを入力してください。";
    return;
  }

  isLoading.value = true;
  errorMsg.value = "";

  try {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email.value, password.value);
    // 成功後の遷移は watchEffect でハンドルされます
  } catch (error: any) {
    console.error("Login error:", error);
    switch (error.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        errorMsg.value = "メールアドレスまたはパスワードが正しくありません。";
        break;
      default:
        errorMsg.value = "ログインに失敗しました。もう一度お試しください。";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">管理者ログイン</h2>
        <p class="mt-2 text-center text-sm text-gray-600">SmartQ-A 管理システム</p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="-space-y-px rounded-md shadow-sm">
          <div>
            <label for="email-address" class="sr-only">メールアドレス</label>
            <input id="email-address" v-model="email" name="email" type="email" required class="relative block w-full rounded-t-md border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="メールアドレス" />
          </div>
          <div>
            <label for="password" class="sr-only">パスワード</label>
            <input id="password" v-model="password" name="password" type="password" required class="relative block w-full rounded-b-md border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="パスワード" />
          </div>
        </div>

        <div v-if="errorMsg" class="text-sm text-red-600 bg-red-50 p-3 rounded">
          {{ errorMsg }}
        </div>

        <div>
          <button type="submit" :disabled="isLoading" class="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition">
            <span v-if="isLoading">ログイン中...</span>
            <span v-else>ログイン</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
