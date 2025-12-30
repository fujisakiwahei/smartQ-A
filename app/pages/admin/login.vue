<script setup lang="ts">
import { signInWithEmailAndPassword } from "firebase/auth";

const { $auth } = useNuxtApp();
const email = ref("");
const password = ref("");
const status = ref("");

const handleLogin = async () => {
  status.value = "接続中...";
  try {
    // Firebase Auth でログイン実行
    const userCredential = await signInWithEmailAndPassword(
      $auth as any, // 後に型定義
      email.value,
      password.value
    );
    status.value = `成功！ログインユーザー: ${userCredential.user.email}`;
  } catch (error: any) {
    status.value = `エラー: ${error.message}`;
  }
};
</script>

<template>
  <UContainer class="flex items-center justify-center min-h-screen">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-bold">Firebase 通信テスト</h1>
      </template>

      <div class="space-y-4">
        <UFormGroup label="メールアドレス">
          <UInput
            v-model="email"
            type="email"
            placeholder="admin@example.com"
          />
        </UFormGroup>
        <UFormGroup label="パスワード">
          <UInput v-model="password" type="password" />
        </UFormGroup>
        <UButton class="mt-8" block @click="handleLogin"
          >ログインテスト実行</UButton
        >

        <p v-if="status" class="mt-4 p-2 bg-gray-100 rounded text-sm break-all">
          {{ status }}
        </p>
      </div>
    </UCard>
  </UContainer>
</template>
