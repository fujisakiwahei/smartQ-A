<script setup lang="ts">
import TenantAdminShell from "~/components/tenant-admin/TenantAdminShell.vue";
definePageMeta({ middleware: "tenant-admin-auth" });

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useNuxtApp, useRoute } from "#app";

type ChatLog = {
  id: string;
  tenant_id: string;
  user_query: string;
  ai_response: string;
  detected_category_ids: string[];
  created_at?: any;
  timestamp?: any;
};

type Category = { id: string; name: string; description: string };

const { $db } = useNuxtApp();
const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId || ""));

const logs = ref<ChatLog[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref("");

const keyword = ref("");
const categoryFilter = ref<string>("");
const fromDate = ref<string>("");
const toDate = ref<string>("");
const selectedId = ref<string | null>(null);

const categoriesById = computed(() => {
  const m = new Map<string, Category>();
  for (const c of categories.value) m.set(c.id, c);
  return m;
});

const toDateObj = (s: string) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getLogDate = (l: ChatLog) => {
  const t = (l.created_at || l.timestamp) as any;
  if (t?.toDate) return t.toDate() as Date;
  if (t instanceof Date) return t;
  return null;
};

const formatDate = (l: ChatLog) => {
  const d = getLogDate(l);
  return d ? d.toLocaleString("ja-JP") : "-";
};

const filteredLogs = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const from = toDateObj(fromDate.value);
  const to = toDateObj(toDate.value);

  const list = logs.value.slice().sort((a, b) => {
    const da = getLogDate(a)?.getTime() ?? 0;
    const db = getLogDate(b)?.getTime() ?? 0;
    return db - da;
  });

  return list.filter((l) => {
    if (categoryFilter.value) {
      if (
        !Array.isArray(l.detected_category_ids) ||
        !l.detected_category_ids.includes(categoryFilter.value)
      ) {
        return false;
      }
    }

    const d = getLogDate(l);
    if (
      from &&
      d &&
      d < new Date(from.getFullYear(), from.getMonth(), from.getDate())
    )
      return false;
    if (to && d) {
      const end = new Date(
        to.getFullYear(),
        to.getMonth(),
        to.getDate(),
        23,
        59,
        59,
        999
      );
      if (d > end) return false;
    }

    if (kw) {
      const hit =
        (l.user_query || "").toLowerCase().includes(kw) ||
        (l.ai_response || "").toLowerCase().includes(kw);
      if (!hit) return false;
    }

    return true;
  });
});

const selectedLog = computed(() => {
  if (!selectedId.value) return null;
  return logs.value.find((l) => l.id === selectedId.value) || null;
});

let unsubLogs: null | (() => void) = null;
let unsubCategories: null | (() => void) = null;

onMounted(() => {
  loading.value = true;
  error.value = "";

  unsubCategories = onSnapshot(
    query(collection($db as any, "tenants", tenantId.value, "categories")),
    (snap) => {
      categories.value = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Category[];
    },
    (err) => {
      console.error(err);
    }
  );

  unsubLogs = onSnapshot(
    query(
      collection($db as any, "chat_logs"),
      where("tenant_id", "==", tenantId.value)
    ),
    (snap) => {
      logs.value = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as ChatLog[];
      loading.value = false;
    },
    (err) => {
      console.error(err);
      loading.value = false;
      error.value = "ログの取得に失敗しました";
    }
  );
});

onBeforeUnmount(() => {
  unsubLogs?.();
  unsubCategories?.();
});
</script>

<template>
  <TenantAdminShell>
    <section class="clientAdminChatLogs">
      <div class="clientAdminChatLogsInner flex flex-col gap-4">
        <section class="clientAdminChatLogsHeader">
          <div class="clientAdminChatLogsHeaderInner">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-chat-bubble-left-right"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="clientAdminChatLogsTitle text-base font-bold">
                    対話ログビューアー
                  </h2>
                </div>
              </template>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                日時・質問・回答・カテゴリ・解決/未解決の確認と、フィルタ（期間/カテゴリ/キーワード）に対応します。
              </p>
            </UCard>
          </div>
        </section>

        <section class="clientAdminChatLogsBody">
          <div class="clientAdminChatLogsBodyInner flex flex-col gap-4">
            <section class="clientAdminChatLogsFilters">
              <div class="clientAdminChatLogsFiltersInner">
                <UCard>
                  <template #header>
                    <h3 class="text-sm font-bold">フィルタ</h3>
                  </template>

                  <div class="flex flex-col gap-3">
                    <div class="flex flex-col sm:flex-row gap-3">
                      <div class="flex-1">
                        <p class="text-xs text-gray-500 mb-1">期間（開始）</p>
                        <input
                          v-model="fromDate"
                          type="date"
                          class="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        />
                      </div>
                      <div class="flex-1">
                        <p class="text-xs text-gray-500 mb-1">期間（終了）</p>
                        <input
                          v-model="toDate"
                          type="date"
                          class="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3">
                      <div class="flex-1">
                        <p class="text-xs text-gray-500 mb-1">カテゴリ</p>
                        <select
                          v-model="categoryFilter"
                          class="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        >
                          <option value="">すべて</option>
                          <option
                            v-for="c in categories"
                            :key="c.id"
                            :value="c.id"
                          >
                            {{ c.name }}
                          </option>
                        </select>
                      </div>
                      <div class="flex-1">
                        <p class="text-xs text-gray-500 mb-1">キーワード</p>
                        <input
                          v-model="keyword"
                          type="text"
                          placeholder="質問/回答から検索"
                          class="w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>
            </section>

            <section class="clientAdminChatLogsSplit">
              <div
                class="clientAdminChatLogsSplitInner flex flex-col lg:flex-row gap-4"
              >
                <section class="clientAdminChatLogsList flex-1 min-w-0">
                  <div class="clientAdminChatLogsListInner">
                    <UCard>
                      <template #header>
                        <div class="flex items-center justify-between gap-3">
                          <h3 class="text-sm font-bold">ログ一覧</h3>
                          <UBadge size="xs" variant="subtle" color="neutral">
                            {{ filteredLogs.length }}件
                          </UBadge>
                        </div>
                      </template>

                      <div v-if="loading" class="p-6 text-center">
                        <USpin class="mx-auto" />
                      </div>
                      <div v-else class="flex flex-col gap-2">
                        <p v-if="error" class="text-xs text-red-600">
                          {{ error }}
                        </p>

                        <button
                          v-for="l in filteredLogs"
                          :key="l.id"
                          type="button"
                          class="text-left rounded-md border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                          :class="
                            selectedId === l.id
                              ? 'ring-2 ring-primary-500/40'
                              : ''
                          "
                          @click="selectedId = l.id"
                        >
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="text-xs text-gray-500 font-mono">
                                {{ formatDate(l) }}
                              </p>
                              <p class="text-sm font-bold truncate mt-1">
                                {{ l.user_query }}
                              </p>
                              <div class="flex flex-wrap gap-1 mt-2">
                                <UBadge
                                  v-for="cid in l.detected_category_ids || []"
                                  :key="cid"
                                  size="xs"
                                  variant="subtle"
                                  color="primary"
                                >
                                  {{ categoriesById.get(cid)?.name || cid }}
                                </UBadge>
                              </div>
                            </div>
                            <UIcon
                              name="i-heroicons-chevron-right"
                              class="w-4 h-4 text-gray-400 shrink-0 mt-1"
                            />
                          </div>
                        </button>

                        <div
                          v-if="filteredLogs.length === 0"
                          class="p-8 text-center text-sm text-gray-500"
                        >
                          条件に一致するログがありません。
                        </div>
                      </div>
                    </UCard>
                  </div>
                </section>

                <section
                  class="clientAdminChatLogsDetail lg:w-[520px] shrink-0"
                >
                  <div class="clientAdminChatLogsDetailInner">
                    <UCard>
                      <template #header>
                        <h3 class="text-sm font-bold">詳細</h3>
                      </template>

                      <div
                        v-if="!selectedLog"
                        class="p-8 text-center text-sm text-gray-500"
                      >
                        左の一覧からログを選択してください。
                      </div>
                      <div v-else class="flex flex-col gap-4">
                        <div class="text-xs text-gray-500 font-mono">
                          {{ formatDate(selectedLog) }}
                        </div>

                        <div class="flex flex-col gap-1">
                          <p class="text-xs text-gray-500">ユーザーの質問</p>
                          <p class="text-sm font-bold whitespace-pre-wrap">
                            {{ selectedLog.user_query }}
                          </p>
                        </div>

                        <div class="flex flex-col gap-1">
                          <p class="text-xs text-gray-500">AIの回答</p>
                          <p class="text-sm whitespace-pre-wrap">
                            {{ selectedLog.ai_response }}
                          </p>
                        </div>

                        <div class="flex flex-col gap-1">
                          <p class="text-xs text-gray-500">判定カテゴリ</p>
                          <div class="flex flex-wrap gap-1">
                            <UBadge
                              v-for="cid in selectedLog.detected_category_ids ||
                              []"
                              :key="cid"
                              size="xs"
                              variant="subtle"
                              color="primary"
                            >
                              {{ categoriesById.get(cid)?.name || cid }}
                            </UBadge>
                            <span
                              v-if="
                                !selectedLog.detected_category_ids ||
                                selectedLog.detected_category_ids.length === 0
                              "
                              class="text-sm text-gray-500"
                            >
                              （なし）
                            </span>
                          </div>
                        </div>
                      </div>
                    </UCard>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </section>
      </div>
    </section>
  </TenantAdminShell>
</template>
