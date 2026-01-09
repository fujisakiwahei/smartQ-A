<script setup lang="ts">
import type {
  Timestamp } from 'firebase/firestore'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'

// --- 1. 型定義 ---
interface Tenant {
  id: string
  name: string
  allowed_domains: string[]
  theme_color: string
  admin_uid?: string
  created_at: any
}

interface Category {
  id: string
  name: string
  description: string
}

interface Knowledge {
  id: string
  question: string
  answer: string
  category_ids?: string[]
}

interface ChatLog {
  id: string
  user_query: string
  ai_response: string
  detected_category_ids: string[]
  created_at: any
}

// --- 2. 状態管理 ---
const { $db } = useNuxtApp()
const tenants = ref<Tenant[]>([])
const selectedTenant = ref<Tenant | null>(null)
const categories = ref<Category[]>([])
const knowledgeBase = ref<Knowledge[]>([])
const chatLogs = ref<ChatLog[]>([])

const loadingList = ref(true)
const loadingDetails = ref(false)

// テーブルの列定義
const tenantColumns: any[] = [
  { key: 'name', label: '企業名' },
  { key: 'created_at', label: '登録日' }
]

// --- 3. データの取得関数 ---

// 全企業リストの取得
const fetchTenants = async () => {
  loadingList.value = true
  try {
    const q = query(collection($db, 'tenants'), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    tenants.value = snap.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
          created_at:
            (doc.data().created_at as Timestamp)
              ?.toDate()
              .toLocaleDateString('ja-JP') || '-'
        } as Tenant)
    )
  } catch (e) {
    console.error('Tenants fetch error:', e)
  } finally {
    loadingList.value = false
  }
}

// 選択した企業の詳細データを取得
const selectTenant = async (tenant: Tenant) => {
  selectedTenant.value = tenant
  loadingDetails.value = true

  // 初期化
  categories.value = []
  knowledgeBase.value = []
  chatLogs.value = []

  try {
    // A. カテゴリ一覧 (サブコレクション)
    const catSnap = await getDocs(
      collection($db, 'tenants', tenant.id, 'categories')
    )
    categories.value = catSnap.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as Category)
    )

    // B. 想定Q&A一覧 (サブコレクション)
    const knSnap = await getDocs(
      collection($db, 'tenants', tenant.id, 'knowledge_base')
    )
    knowledgeBase.value = knSnap.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as Knowledge)
    )

    // C. 最新10件のチャットログ (グローバルコレクションからフィルタ)
    const logQuery = query(
      collection($db, 'chat_logs'),
      where('tenant_id', '==', tenant.id), // ドキュメント上のフィールド名に合わせる
      orderBy('created_at', 'desc'),
      limit(10)
    )
    const logSnap = await getDocs(logQuery)
    chatLogs.value = logSnap.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
          created_at:
            (doc.data().created_at as Timestamp)
              ?.toDate()
              .toLocaleString('ja-JP') || '-'
        } as ChatLog)
    )
  } catch (e) {
    console.error('Details fetch error:', e)
  } finally {
    loadingDetails.value = false
  }
}

// --- 4. ライフサイクル ---
onMounted(() => {
  fetchTenants()
})

// テーマカラーの適用クラス
const getThemeColorClass = (color: string) => {
  const colors: Record<string, string> = {
    basic: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    violet: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    slate: 'text-slate-600 bg-slate-50 dark:bg-slate-900/20',
    cyan: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20'
  }
  return colors[color] || colors.basic
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
    <!-- ヘッダー統計 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <UCard>
        <div class="flex items-center gap-4">
          <div
            class="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600"
          >
            <UIcon
              name="i-heroicons-building-office-2"
              class="w-6 h-6"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500">
              総企業数
            </p>
            <p class="text-2xl font-bold">
              {{ tenants.length }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- 左側：企業一覧 -->
      <div class="lg:col-span-4">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-bold">
                企業一覧
              </h3>
              <UButton
                to="/admin/tenants/create"
                icon="i-heroicons-plus"
                size="xs"
              >
                新規
              </UButton>
            </div>
          </template>

          <div class="max-h-[70vh] overflow-y-auto">
            <div
              v-for="tenant in tenants"
              :key="tenant.id"
              class="p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              :class="
                selectedTenant?.id === tenant.id
                  ? 'bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary-500'
                  : ''
              "
              @click="selectTenant(tenant)"
            >
              <div class="flex justify-between items-start">
                <span class="font-medium text-gray-900 dark:text-white">{{
                  tenant.name
                }}</span>
                <span class="text-xs text-gray-400">{{
                  tenant.created_at
                }}</span>
              </div>
              <div class="mt-1 flex gap-1">
                <UBadge
                  v-for="d in tenant.allowed_domains"
                  :key="d"
                  size="xs"
                  variant="subtle"
                  color="neutral"
                >
                  {{ d }}
                </UBadge>
              </div>
            </div>
            <div
              v-if="loadingList"
              class="p-8 text-center"
            >
              <USpin class="mx-auto" />
            </div>
            <div
              v-if="!loadingList && tenants.length === 0"
              class="p-8 text-center text-gray-500 text-sm"
            >
              企業が登録されていません
            </div>
          </div>
        </UCard>
      </div>

      <!-- 右側：詳細表示 -->
      <div class="lg:col-span-8">
        <div
          v-if="selectedTenant"
          class="space-y-6"
        >
          <!-- 企業基本情報 -->
          <UCard>
            <div class="flex justify-between items-center">
              <div>
                <div class="flex items-center gap-3">
                  <h2 class="text-3xl font-extrabold tracking-tight">
                    {{ selectedTenant.name }}
                  </h2>
                  <UBadge
                    :class="getThemeColorClass(selectedTenant.theme_color)"
                    variant="solid"
                    size="md"
                    class="px-3 py-1 text-sm font-bold uppercase tracking-wider shadow-sm"
                  >
                    {{ selectedTenant.theme_color }}
                  </UBadge>
                </div>
                <p
                  class="text-sm text-gray-500 mt-2 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit"
                >
                  Tenant ID: {{ selectedTenant.id }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- 最新チャットログ -->
          <UCard>
            <template #header>
              <h4 class="font-bold flex items-center gap-2 text-lg">
                <UIcon
                  name="i-heroicons-chat-bubble-left-right"
                  class="text-primary-500"
                />最新のQ&Aログ（10件）
              </h4>
            </template>
            <div
              v-if="loadingDetails"
              class="p-8 text-center"
            >
              <USpin class="mx-auto" />
            </div>
            <div
              v-else
              class="overflow-x-auto"
            >
              <table class="w-full text-sm text-left">
                <thead
                  class="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-medium text-xs"
                >
                  <tr>
                    <th class="px-4 py-3">
                      日時
                    </th>
                    <th class="px-4 py-3">
                      ユーザーの質問
                    </th>
                    <th class="px-4 py-3">
                      判定カテゴリ
                    </th>
                    <th class="px-4 py-3">
                      AIの回答
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y dark:divide-gray-800">
                  <tr
                    v-for="log in chatLogs"
                    :key="log.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td
                      class="px-4 py-3 whitespace-nowrap text-gray-400 font-mono text-xs"
                    >
                      {{ log.created_at }}
                    </td>
                    <td class="px-4 py-3 max-w-xs truncate">
                      {{ log.user_query }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-1">
                        <UBadge
                          v-for="cid in log.detected_category_ids"
                          :key="cid"
                          size="xs"
                          color="primary"
                          variant="subtle"
                        >
                          {{ cid }}
                        </UBadge>
                      </div>
                    </td>
                    <td class="px-4 py-3 max-w-xs truncate">
                      {{ log.ai_response }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div
                v-if="chatLogs.length === 0"
                class="p-12 text-center text-gray-400"
              >
                <UIcon
                  name="i-heroicons-inbox"
                  class="w-8 h-8 mx-auto mb-2 opacity-20"
                />
                <p>チャット履歴がありません</p>
              </div>
            </div>
          </UCard>

          <!-- カテゴリ一覧 -->
          <UCard>
            <template #header>
              <h4 class="font-bold flex items-center gap-2 text-lg">
                <UIcon
                  name="i-heroicons-tag"
                  class="text-primary-500"
                />カテゴリ一覧
              </h4>
            </template>
            <div
              v-if="loadingDetails"
              class="p-8 text-center"
            >
              <USpin class="mx-auto" />
            </div>
            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div
                v-for="cat in categories"
                :key="cat.id"
                class="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-sm"
              >
                <div class="font-bold text-gray-900 dark:text-white">
                  {{ cat.name }}
                </div>
                <div class="text-sm text-gray-500 mt-1">
                  {{ cat.description }}
                </div>
              </div>
              <div
                v-if="categories.length === 0"
                class="col-span-full p-4 text-center text-gray-400 text-sm"
              >
                カテゴリが登録されていません
              </div>
            </div>
          </UCard>

          <!-- 想定Q&A -->
          <UCard>
            <template #header>
              <h4 class="font-bold flex items-center gap-2 text-lg">
                <UIcon
                  name="i-heroicons-academic-cap"
                  class="text-primary-500"
                />想定Q&A
              </h4>
            </template>
            <div
              v-if="loadingDetails"
              class="p-8 text-center"
            >
              <USpin class="mx-auto" />
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="kb in knowledgeBase"
                :key="kb.id"
                class="p-4 border-l-4 border-primary-500 bg-white dark:bg-gray-900 rounded-r-lg shadow-sm"
              >
                <div class="flex justify-between items-start gap-4">
                  <div
                    class="font-bold text-gray-900 dark:text-white flex items-start gap-2"
                  >
                    <span class="text-primary-500 font-black">Q.</span>
                    {{ kb.question }}
                  </div>
                  <UBadge
                    v-if="kb.category_ids && kb.category_ids.length > 0"
                    size="xs"
                    variant="subtle"
                    color="neutral"
                    class="shrink-0"
                  >
                    {{
                      kb.category_ids
                        .map(
                          (cid) =>
                            categories.find((c) => c.id === cid)?.name || cid
                        )
                        .join(", ")
                    }}
                  </UBadge>
                </div>
                <div
                  class="text-gray-600 dark:text-gray-400 mt-2 text-sm flex items-start gap-2"
                >
                  <span class="text-gray-400 font-black">A.</span>
                  {{ kb.answer }}
                </div>
              </div>
              <div
                v-if="knowledgeBase.length === 0"
                class="p-8 text-center text-gray-400 text-sm"
              >
                Q&Aが登録されていません
              </div>
            </div>
          </UCard>
        </div>

        <!-- 未選択状態 -->
        <div
          v-else
          class="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 p-12"
        >
          <div class="text-center">
            <UIcon
              name="i-heroicons-cursor-arrow-ripple"
              class="w-12 h-12 text-gray-300 mx-auto mb-4"
            />
            <p class="text-gray-500">
              左側の企業一覧から詳細を表示したい企業を選択してください
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
