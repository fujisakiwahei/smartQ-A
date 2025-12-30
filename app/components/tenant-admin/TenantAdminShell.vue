<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "#app";
import { signOut } from "firebase/auth";
import { useTenantAdminSession } from "~/composables/useTenantAdminSession";

type NavItem = {
  label: string;
  to: string;
  icon: string;
};

const route = useRoute();
const router = useRouter();
const { $auth } = useNuxtApp();
const session = useTenantAdminSession();

const tenantId = computed(() => String(route.params.tenantId || ""));
const tenantName = computed(() => {
  return session.tenant.value?.name || tenantId.value;
});

const logout = async () => {
  await signOut($auth as any);
  await router.replace("/tenant-admin/login");
};

const navItems = computed<NavItem[]>(() => {
  const id = tenantId.value;
  return [
    {
      label: "ダッシュボード",
      to: `/tenant-admin/${id}/dashboard`,
      icon: "i-heroicons-chart-bar-square",
    },
    {
      label: "カテゴリ管理",
      to: `/tenant-admin/${id}/categories`,
      icon: "i-heroicons-tag",
    },
    {
      label: "Q&A管理",
      to: `/tenant-admin/${id}/knowledge`,
      icon: "i-heroicons-academic-cap",
    },
    {
      label: "ウィジェット設定",
      to: `/tenant-admin/${id}/widget`,
      icon: "i-heroicons-paint-brush",
    },
    {
      label: "対話ログ",
      to: `/tenant-admin/${id}/chat-logs`,
      icon: "i-heroicons-chat-bubble-left-right",
    },
  ];
});
</script>

<template>
  <div class="tenantAdminShell min-h-[calc(100vh-8rem)]">
    <div class="tenantAdminShellInner flex flex-col gap-4 p-4 sm:p-6">
      <section class="tenantAdminShellHeader">
        <div class="tenantAdminShellHeaderInner flex flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon
                name="i-heroicons-building-office-2"
                class="w-5 h-5 text-primary-500"
              />
              <h1
                class="tenantAdminShellHeaderTitle text-lg sm:text-xl font-bold truncate"
              >
                {{ tenantName }}
              </h1>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-arrow-left-on-rectangle"
              @click="logout"
            >
              ログアウト
            </UButton>
          </div>
          <p
            class="tenantAdminShellHeaderTenant text-xs text-gray-500 font-mono break-all"
          >
            Tenant ID: {{ tenantId }}
          </p>
        </div>
      </section>

      <section class="tenantAdminShellBody">
        <div class="tenantAdminShellBodyInner flex flex-col lg:flex-row gap-4">
          <nav class="tenantAdminShellNav lg:w-64 shrink-0">
            <div class="tenantAdminShellNavInner flex flex-col gap-2">
              <UCard>
                <div class="flex flex-col gap-1">
                  <NuxtLink
                    v-for="item in navItems"
                    :key="item.to"
                    :to="item.to"
                    class="tenantAdminShellNavItem flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                    :class="
                      route.path === item.to
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200'
                    "
                  >
                    <UIcon :name="item.icon" class="w-4 h-4" />
                    <span class="tenantAdminShellNavItemLabel">
                      {{ item.label }}
                    </span>
                  </NuxtLink>
                </div>
              </UCard>
            </div>
          </nav>

          <main class="tenantAdminShellMain flex-1 min-w-0">
            <div class="tenantAdminShellMainInner flex flex-col gap-4">
              <slot />
            </div>
          </main>
        </div>
      </section>
    </div>
  </div>
</template>
