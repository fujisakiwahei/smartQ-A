<script setup lang="ts">
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, computed, watchEffect } from "vue";
import { useNuxtApp, useRoute, useRouter } from "#app";
import { useTenantAdminSession } from "~/composables/useTenantAdminSession";

const { $auth } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const session = useTenantAdminSession();

const email = ref("");
const password = ref("");
const status = ref<"idle" | "loading">("idle");
const error = ref("");

const redirectTo = computed(() =>
  typeof route.query.redirect === "string" ? route.query.redirect : ""
);

watchEffect(async () => {
  // すでにログイン済みなら自動で自分のtenantへ
  if (session.firebaseUser.value && session.tenant.value?.id) {
    if (redirectTo.value) {
      await router.replace(redirectTo.value);
    } else {
      await router.replace(
        `/tenant-admin/${session.tenant.value.id}/dashboard`
      );
    }
  }
});

const login = async () => {
  error.value = "";
  status.value = "loading";
  try {
    const cred = await signInWithEmailAndPassword(
      $auth as any,
      email.value.trim(),
      password.value
    );

    // ここでは onAuthStateChanged が tenant 解決まで行うので、短時間待つ
    const waitStart = Date.now();
    while (!session.tenant.value && Date.now() - waitStart < 4000) {
      await new Promise((r) => setTimeout(r, 50));
    }

    if (!session.tenant.value?.id) {
      await signOut($auth as any);
      error.value =
        "このアカウントに紐づくテナントが見つかりませんでした（tenants.tenant_uid を確認してください）";
      return;
    }

    const target =
      redirectTo.value || `/tenant-admin/${session.tenant.value.id}/dashboard`;
    await router.replace(target);
  } catch (e: any) {
    console.error(e);
    error.value = e?.message || "ログインに失敗しました";
  } finally {
    status.value = "idle";
  }
};
</script>

<template>
  <div class="tenantAdminLogin min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="tenantAdminLoginInner flex items-center justify-center p-4">
      <section class="tenantAdminLoginCard w-full max-w-sm">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-lock-closed"
                class="w-5 h-5 text-primary-500"
              />
              <h1 class="tenantAdminLoginTitle text-lg font-bold">
                Client Admin ログイン
              </h1>
            </div>
          </template>

          <div class="flex flex-col gap-4">
            <UFormGroup label="メールアドレス">
              <UInput
                v-model="email"
                type="email"
                placeholder="you@example.com"
              />
            </UFormGroup>

            <UFormGroup label="パスワード">
              <UInput
                v-model="password"
                type="password"
                @keydown.enter.prevent="login"
              />
            </UFormGroup>

            <UButton
              color="primary"
              block
              :loading="status === 'loading'"
              icon="i-heroicons-arrow-right-circle"
              @click="login"
            >
              ログイン
            </UButton>

            <p v-if="error" class="text-xs text-red-600 break-words">
              {{ error }}
            </p>

            <p
              v-if="session.tenantError"
              class="text-xs text-red-600 break-words"
            >
              {{ session.tenantError }}
            </p>
          </div>
        </UCard>
      </section>
    </div>
  </div>
</template>
