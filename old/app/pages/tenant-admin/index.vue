<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { signOut } from "firebase/auth";
import { useNuxtApp, useRouter } from "#app";
import { useTenantAdminSession } from "~/composables/useTenantAdminSession";

const { $auth } = useNuxtApp();
const router = useRouter();
const session = useTenantAdminSession();

const isAuthed = computed(() => Boolean(session.firebaseUser.value));

watchEffect(async () => {
  if (session.firebaseUser.value && session.tenant.value?.id) {
    await router.replace(`/tenant-admin/${session.tenant.value.id}/dashboard`);
  }
});

const goLogin = async () => {
  await router.push("/tenant-admin/login");
};

const logout = async () => {
  await signOut($auth as any);
  await router.replace("/tenant-admin/login");
};
</script>

<template>
  <div class="tenantAdminLanding min-h-screen bg-gray-50 dark:bg-gray-950">
    <div
      class="tenantAdminLandingInner flex flex-col items-center justify-center p-4"
    >
      <section class="tenantAdminLandingCard w-full max-w-xl">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-building-office-2"
                class="w-5 h-5 text-primary-500"
              />
              <h1 class="tenantAdminLandingTitle text-lg font-bold">
                利用企業向け管理画面（Client Admin）
              </h1>
            </div>
          </template>

          <div class="tenantAdminLandingContent flex flex-col gap-4">
            <section class="tenantAdminLandingStatus">
              <div
                class="tenantAdminLandingStatusInner flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <p v-if="session.tenantLoading">テナント情報を確認中です…</p>
                <p v-else-if="session.tenantError">{{ session.tenantError }}</p>
                <p v-else>ログインして自分のテナント管理画面へ進みます。</p>
              </div>
            </section>

            <section class="tenantAdminLandingActions">
              <div
                class="tenantAdminLandingActionsInner flex items-center justify-end gap-2"
              >
                <UButton
                  v-if="isAuthed"
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-arrow-left-on-rectangle"
                  @click="logout"
                >
                  ログアウト
                </UButton>
                <UButton
                  color="primary"
                  icon="i-heroicons-lock-closed"
                  @click="goLogin"
                >
                  ログインへ
                </UButton>
              </div>
            </section>
          </div>
        </UCard>
      </section>
    </div>
  </div>
</template>
