<script setup lang="ts">
import TenantAdminShell from "~/components/tenant-admin/TenantAdminShell.vue";
definePageMeta({ middleware: "tenant-admin-auth" });

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useNuxtApp, useRoute } from "#app";

type Category = { id: string; name: string; description: string };

type ChatLog = {
  id: string;
  tenant_id: string;
  user_query: string;
  ai_response: string;
  detected_category_ids: string[];
  created_at?: any;
  timestamp?: any;
};

type PieItem = { label: string; value: number; color: string };
type BarItem = { label: string; value: number };

const { $db } = useNuxtApp();
const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId || ""));

const loading = ref(true);
const error = ref("");
const categories = ref<Category[]>([]);
const logs = ref<ChatLog[]>([]);

const breakdown = ref<"day" | "hour">("day");
const fromDate = ref<string>("");
const toDate = ref<string>("");

const initDateRange = () => {
  const today = new Date();
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  fromDate.value = fmt(from);
  toDate.value = fmt(to);
};

initDateRange();

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

const isInRange = (d: Date | null, from: Date | null, to: Date | null) => {
  if (!d) return false;
  if (from) {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    if (d < start) return false;
  }
  if (to) {
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
  return true;
};

const isUnresolved = (l: ChatLog) => {
  // 仕様: AIが「答えられません」と回答した数を未解決として扱う
  const r = (l.ai_response || "").trim();
  return r.includes("答えられません");
};

const categoriesById = computed(() => {
  const m = new Map<string, Category>();
  for (const c of categories.value) m.set(c.id, c);
  return m;
});

const rangeFrom = computed(() => toDateObj(fromDate.value));
const rangeTo = computed(() => toDateObj(toDate.value));

const filteredLogs = computed(() => {
  const from = rangeFrom.value;
  const to = rangeTo.value;
  return logs.value.filter((l) => isInRange(getLogDate(l), from, to));
});

const totalCount = computed(() => filteredLogs.value.length);
const unresolvedCount = computed(
  () => filteredLogs.value.filter(isUnresolved).length
);
const resolvedCount = computed(() => totalCount.value - unresolvedCount.value);
const resolvedRate = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((resolvedCount.value / totalCount.value) * 1000) / 10;
});

const resolvedPie = computed<PieItem[]>(() => [
  { label: "解決", value: resolvedCount.value, color: "#10B981" }, // emerald-500
  { label: "未解決", value: unresolvedCount.value, color: "#EF4444" }, // red-500
]);

const categoryCounts = computed(() => {
  const m = new Map<string, number>();
  for (const l of filteredLogs.value) {
    const ids = Array.isArray(l.detected_category_ids)
      ? l.detected_category_ids
      : [];
    if (ids.length === 0) {
      m.set("__uncategorized__", (m.get("__uncategorized__") || 0) + 1);
      continue;
    }
    for (const cid of ids) {
      m.set(cid, (m.get(cid) || 0) + 1);
    }
  }
  return m;
});

const categoryPie = computed<PieItem[]>(() => {
  const palette = [
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#06B6D4",
    "#F97316",
    "#22C55E",
    "#EC4899",
  ];
  const entries = Array.from(categoryCounts.value.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const top = entries.slice(0, 6);
  const rest = entries.slice(6);
  const result: PieItem[] = [];

  top.forEach(([id, v], idx) => {
    const label =
      id === "__uncategorized__"
        ? "未分類"
        : categoriesById.value.get(id)?.name || id;
    result.push({
      label,
      value: v,
      color: palette[idx % palette.length] ?? "#3B82F6",
    });
  });

  const restSum = rest.reduce((acc, [, v]) => acc + v, 0);
  if (restSum > 0)
    result.push({ label: "その他", value: restSum, color: "#94A3B8" }); // slate-400
  return result;
});

const volumeBars = computed<BarItem[]>(() => {
  const from = rangeFrom.value;
  const to = rangeTo.value;
  const list = filteredLogs.value;

  if (breakdown.value === "hour") {
    const m = new Map<number, number>();
    for (let h = 0; h < 24; h++) m.set(h, 0);
    for (const l of list) {
      const d = getLogDate(l);
      if (!isInRange(d, from, to)) continue;
      const h = d?.getHours();
      if (typeof h === "number") m.set(h, (m.get(h) || 0) + 1);
    }
    return Array.from(m.entries()).map(([h, v]) => ({
      label: `${h}時`,
      value: v,
    }));
  }

  // day
  const start = from
    ? new Date(from.getFullYear(), from.getMonth(), from.getDate())
    : null;
  const end = to
    ? new Date(to.getFullYear(), to.getMonth(), to.getDate())
    : null;
  if (!start || !end) return [];

  const days: BarItem[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(cur.getDate()).padStart(2, "0")}`;
    days.push({ label: key.slice(5), value: 0 });
    cur.setDate(cur.getDate() + 1);
  }

  const idxByLabel = new Map<string, number>();
  days.forEach((d, i) => idxByLabel.set(d.label, i));

  for (const l of list) {
    const d = getLogDate(l);
    if (!d) continue;
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const idx = idxByLabel.get(label);
    if (typeof idx === "number") {
      const item = days[idx];
      if (item) item.value += 1;
    }
  }
  return days;
});

const copyText = async (text: string) => {
  try {
    await globalThis.navigator?.clipboard?.writeText(text);
  } catch (e) {
    console.error(e);
    alert("コピーに失敗しました");
  }
};

const unresolvedCandidates = computed(() => {
  const items = filteredLogs.value.filter(isUnresolved);
  const m = new Map<
    string,
    { question: string; count: number; lastAt: Date | null }
  >();
  for (const l of items) {
    const q = (l.user_query || "").trim();
    if (!q) continue;
    const key = q.toLowerCase();
    const d = getLogDate(l);
    const prev = m.get(key);
    if (!prev) {
      m.set(key, { question: q, count: 1, lastAt: d });
    } else {
      prev.count += 1;
      if (d && (!prev.lastAt || d > prev.lastAt)) prev.lastAt = d;
    }
  }
  return Array.from(m.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

const donutRing = (items: PieItem[]) => {
  const total = items.reduce((acc, i) => acc + i.value, 0);
  const r = 44;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return items.map((it) => {
    const frac = total ? it.value / total : 0;
    const dash = frac * c;
    const offset = c - acc;
    acc += dash;
    return {
      ...it,
      r,
      c,
      dash: `${dash} ${c - dash}`,
      offset,
    };
  });
};

const resolvedDonut = computed(() => donutRing(resolvedPie.value));
const categoryDonut = computed(() => donutRing(categoryPie.value));

const barMax = computed(() =>
  Math.max(1, ...volumeBars.value.map((b) => b.value))
);

const setLast = (days: number) => {
  const today = new Date();
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  fromDate.value = fmt(from);
  toDate.value = fmt(to);
};

let unsubCategories: null | (() => void) = null;
let unsubLogs: null | (() => void) = null;

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
      error.value = "カテゴリの取得に失敗しました";
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
  unsubCategories?.();
  unsubLogs?.();
});
</script>

<template>
  <TenantAdminShell>
    <section class="clientAdminDashboard">
      <div class="clientAdminDashboardInner flex flex-col gap-4">
        <section class="clientAdminDashboardHeader">
          <div class="clientAdminDashboardHeaderInner">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-chart-bar-square"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="clientAdminDashboardTitle text-base font-bold">
                    ダッシュボード（分析・統計）
                  </h2>
                </div>
              </template>

              <div class="flex flex-col gap-3">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  指定期間の稼働状況を可視化します（未解決＝AI回答に「答えられません」を含むログ）。
                </p>

                <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div class="flex flex-col gap-1">
                    <p class="text-xs text-gray-500">期間（開始）</p>
                    <input
                      v-model="fromDate"
                      type="date"
                      class="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <p class="text-xs text-gray-500">期間（終了）</p>
                    <input
                      v-model="toDate"
                      type="date"
                      class="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="subtle"
                      @click="setLast(7)"
                      >直近7日</UButton
                    >
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="subtle"
                      @click="setLast(30)"
                      >直近30日</UButton
                    >
                    <UButton
                      size="xs"
                      :color="breakdown === 'day' ? 'primary' : 'neutral'"
                      :variant="breakdown === 'day' ? 'solid' : 'subtle'"
                      @click="breakdown = 'day'"
                    >
                      日別
                    </UButton>
                    <UButton
                      size="xs"
                      :color="breakdown === 'hour' ? 'primary' : 'neutral'"
                      :variant="breakdown === 'hour' ? 'solid' : 'subtle'"
                      @click="breakdown = 'hour'"
                    >
                      時間別
                    </UButton>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </section>

        <section class="clientAdminDashboardSummary">
          <div class="clientAdminDashboardSummaryInner flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row gap-3">
              <UCard class="flex-1">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xs text-gray-500">総対話数</p>
                    <p class="text-2xl font-bold">{{ totalCount }}</p>
                  </div>
                  <UIcon
                    name="i-heroicons-chat-bubble-left-right"
                    class="w-6 h-6 text-primary-500"
                  />
                </div>
              </UCard>
              <UCard class="flex-1">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xs text-gray-500">未解決数</p>
                    <p class="text-2xl font-bold text-red-600">
                      {{ unresolvedCount }}
                    </p>
                  </div>
                  <UIcon
                    name="i-heroicons-exclamation-triangle"
                    class="w-6 h-6 text-red-500"
                  />
                </div>
              </UCard>
              <UCard class="flex-1">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xs text-gray-500">解決率</p>
                    <p class="text-2xl font-bold">{{ resolvedRate }}%</p>
                    <p class="text-xs text-gray-500">
                      解決 {{ resolvedCount }} / 未解決 {{ unresolvedCount }}
                    </p>
                  </div>
                </div>
              </UCard>
            </div>
            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
          </div>
        </section>

        <section class="clientAdminDashboardVisuals">
          <div
            class="clientAdminDashboardVisualsInner flex flex-col lg:flex-row gap-4"
          >
            <section class="clientAdminDashboardPie lg:w-[420px] shrink-0">
              <div class="clientAdminDashboardPieInner flex flex-col gap-4">
                <UCard>
                  <template #header>
                    <h3 class="text-sm font-bold">解決率（円グラフ）</h3>
                  </template>
                  <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div
                      class="w-[140px] h-[140px] shrink-0 mx-auto sm:mx-0 relative"
                    >
                      <svg viewBox="0 0 120 120" class="w-full h-full">
                        <circle
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke="#E5E7EB"
                          stroke-width="12"
                        />
                        <circle
                          v-for="s in resolvedDonut"
                          :key="s.label"
                          cx="60"
                          cy="60"
                          :r="s.r"
                          fill="none"
                          :stroke="s.color"
                          stroke-width="12"
                          stroke-linecap="round"
                          :stroke-dasharray="s.dash"
                          :stroke-dashoffset="s.offset"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div
                        class="absolute inset-0 flex flex-col items-center justify-center"
                      >
                        <p class="text-xs text-gray-500">解決率</p>
                        <p class="text-xl font-bold">{{ resolvedRate }}%</p>
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      <div
                        v-for="s in resolvedPie"
                        :key="s.label"
                        class="flex items-center gap-2"
                      >
                        <span
                          class="w-3 h-3 rounded-sm"
                          :style="{ backgroundColor: s.color }"
                        />
                        <span class="text-sm font-medium">{{ s.label }}</span>
                        <span class="text-sm text-gray-500">{{ s.value }}</span>
                      </div>
                    </div>
                  </div>
                </UCard>

                <UCard>
                  <template #header>
                    <h3 class="text-sm font-bold">
                      カテゴリ別質問頻度（円グラフ）
                    </h3>
                  </template>
                  <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div
                      class="w-[140px] h-[140px] shrink-0 mx-auto sm:mx-0 relative"
                    >
                      <svg viewBox="0 0 120 120" class="w-full h-full">
                        <circle
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke="#E5E7EB"
                          stroke-width="12"
                        />
                        <circle
                          v-for="s in categoryDonut"
                          :key="s.label"
                          cx="60"
                          cy="60"
                          :r="s.r"
                          fill="none"
                          :stroke="s.color"
                          stroke-width="12"
                          stroke-linecap="round"
                          :stroke-dasharray="s.dash"
                          :stroke-dashoffset="s.offset"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                    </div>
                    <div class="flex flex-col gap-2 min-w-0">
                      <div
                        v-for="s in categoryPie"
                        :key="s.label"
                        class="flex items-center gap-2 min-w-0"
                      >
                        <span
                          class="w-3 h-3 rounded-sm shrink-0"
                          :style="{ backgroundColor: s.color }"
                        />
                        <span class="text-sm font-medium truncate">{{
                          s.label
                        }}</span>
                        <span class="text-sm text-gray-500 shrink-0">{{
                          s.value
                        }}</span>
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>
            </section>

            <section class="clientAdminDashboardBars flex-1 min-w-0">
              <div class="clientAdminDashboardBarsInner flex flex-col gap-4">
                <UCard>
                  <template #header>
                    <h3 class="text-sm font-bold">
                      質問ボリューム推移（棒グラフ）—
                      {{ breakdown === "day" ? "日別" : "時間別" }}
                    </h3>
                  </template>

                  <div v-if="loading" class="p-6 text-center">
                    <USpin class="mx-auto" />
                  </div>
                  <div v-else class="flex flex-col gap-3">
                    <div class="flex items-end gap-1 overflow-x-auto pb-2">
                      <div
                        v-for="b in volumeBars"
                        :key="b.label"
                        class="flex flex-col items-center justify-end gap-1"
                        style="min-width: 26px"
                      >
                        <div
                          class="w-5 rounded-sm bg-primary-500/70"
                          :style="{
                            height: `${Math.round((b.value / barMax) * 120)}px`,
                          }"
                          :title="`${b.label}: ${b.value}`"
                        />
                        <p class="text-[10px] text-gray-500 whitespace-nowrap">
                          {{ b.label }}
                        </p>
                      </div>
                    </div>
                    <p class="text-xs text-gray-500">最大値: {{ barMax }}</p>
                  </div>
                </UCard>

                <UCard>
                  <template #header>
                    <h3 class="text-sm font-bold">AI改善候補（未解決分析）</h3>
                  </template>
                  <div class="flex flex-col gap-2">
                    <p class="text-xs text-gray-500">
                      「答えられません」になった質問を頻度順で抽出しています（上位10件）。
                    </p>
                    <div
                      v-if="unresolvedCandidates.length === 0"
                      class="p-6 text-center text-sm text-gray-500"
                    >
                      未解決ログがありません。いい感じです（AIもニッコリ）。
                    </div>
                    <div v-else class="flex flex-col gap-2">
                      <div
                        v-for="c in unresolvedCandidates"
                        :key="c.question"
                        class="rounded-md border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-950 flex flex-col gap-2"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <p class="text-sm font-bold whitespace-pre-wrap">
                            {{ c.question }}
                          </p>
                          <UBadge
                            size="xs"
                            variant="subtle"
                            color="warning"
                            class="shrink-0"
                          >
                            {{ c.count }}回
                          </UBadge>
                        </div>
                        <p
                          v-if="c.lastAt"
                          class="text-xs text-gray-500 font-mono"
                        >
                          最終発生: {{ c.lastAt.toLocaleString("ja-JP") }}
                        </p>
                        <div class="flex items-center justify-end gap-2">
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-clipboard-document"
                            @click="copyText(c.question)"
                          >
                            質問をコピー
                          </UButton>
                          <UButton
                            size="xs"
                            color="primary"
                            variant="subtle"
                            icon="i-heroicons-plus-circle"
                            :to="`/tenant-admin/${tenantId}/knowledge`"
                          >
                            Q&A追加へ
                          </UButton>
                        </div>
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
  </TenantAdminShell>
</template>
