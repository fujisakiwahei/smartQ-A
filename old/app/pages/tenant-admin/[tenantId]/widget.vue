<script setup lang="ts">
import TenantAdminShell from "~/components/tenant-admin/TenantAdminShell.vue";
definePageMeta({ middleware: "tenant-admin-auth" });

import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useNuxtApp, useRoute } from "#app";
import { COLOR_OPTIONS } from "~/utils/constants";

type Tenant = {
  id: string;
  name?: string;
  theme_color?: string;
  allowed_domains?: string[];
};

const { $db } = useNuxtApp();
const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId || ""));

const tenant = ref<Tenant | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const copied = ref(false);

const colorOptions = COLOR_OPTIONS;

const embedTag = computed(() => {
  // SFC内で script 終了タグ文字列を直接書くとパーサが誤認するため分割
  return (
    `<script\n  src="https://smart-qa-widget.vercel.app/widget.js"\n  id="smart-qa-loader"\n  data-tenant-id="${tenantId.value}"\n></` +
    `script>`
  );
});

const selectedColor = computed({
  get() {
    return tenant.value?.theme_color || "basic";
  },
  set(v: string) {
    if (!tenant.value) tenant.value = { id: tenantId.value };
    tenant.value.theme_color = v;
  },
});

const save = async () => {
  error.value = "";
  saving.value = true;
  try {
    await updateDoc(doc($db as any, "tenants", tenantId.value), {
      theme_color: selectedColor.value,
    });
  } catch (e) {
    console.error(e);
    error.value = "保存に失敗しました";
  } finally {
    saving.value = false;
  }
};

const copy = async () => {
  copied.value = false;
  try {
    await navigator.clipboard.writeText(embedTag.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1200);
  } catch (e) {
    console.error(e);
    alert("コピーに失敗しました");
  }
};

let unsub: null | (() => void) = null;

onMounted(() => {
  loading.value = true;
  unsub = onSnapshot(
    doc($db as any, "tenants", tenantId.value),
    (snap) => {
      tenant.value = { id: snap.id, ...(snap.data() as any) } as Tenant;
      loading.value = false;
    },
    (err) => {
      console.error(err);
      loading.value = false;
      error.value = "テナント情報の取得に失敗しました";
    }
  );
});

onBeforeUnmount(() => {
  unsub?.();
});
</script>

<template>
  <TenantAdminShell>
    <section class="clientAdminWidget">
      <div class="clientAdminWidgetInner flex flex-col gap-4">
        <section class="clientAdminWidgetHeader">
          <div class="clientAdminWidgetHeaderInner">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-paint-brush"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="clientAdminWidgetTitle text-base font-bold">
                    ウィジェット設定
                  </h2>
                </div>
              </template>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                テーマカラーと、サイトに貼り付ける埋め込みタグを管理します。
              </p>
            </UCard>
          </div>
        </section>

        <section class="clientAdminWidgetBody">
          <div class="clientAdminWidgetBodyInner flex flex-col gap-4">
            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-sm font-bold">外観カスタマイズ</h3>
                  <UButton
                    color="primary"
                    :loading="saving"
                    icon="i-heroicons-check-badge"
                    @click="save"
                  >
                    保存
                  </UButton>
                </div>
              </template>

              <div v-if="loading" class="p-6 text-center">
                <USpin class="mx-auto" />
              </div>
              <div v-else class="flex flex-col gap-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  テーマカラー（プリセット）
                </p>

                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="c in colorOptions"
                    :key="c.value"
                    type="button"
                    class="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-800 flex items-center justify-center transition-transform hover:scale-105"
                    :class="
                      selectedColor === c.value ? 'ring-2 ring-primary-500' : ''
                    "
                    @click="selectedColor = c.value"
                  >
                    <span class="w-6 h-6 rounded-sm" :class="c.hex" />
                  </button>
                </div>

                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span>選択中:</span>
                  <UBadge size="xs" variant="subtle" color="primary">{{
                    selectedColor
                  }}</UBadge>
                </div>

                <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-sm font-bold">設置タグの取得</h3>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-clipboard-document"
                    @click="copy"
                  >
                    {{ copied ? "コピーしました" : "コピー" }}
                  </UButton>
                </div>
              </template>

              <div class="flex flex-col gap-2">
                <p class="text-xs text-gray-500">
                  ※開発用ダミーの想定ですが、ここでは tenantId
                  を埋め込んだ形で表示します。
                </p>
                <pre
                  class="text-xs overflow-x-auto rounded-md bg-gray-50 dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-800"
                ><code>{{ embedTag }}</code></pre>
              </div>
            </UCard>
          </div>
        </section>
      </div>
    </section>
  </TenantAdminShell>
</template>
