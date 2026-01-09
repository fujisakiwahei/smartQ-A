<script setup lang="ts">
import TenantAdminShell from "~/components/tenant-admin/TenantAdminShell.vue";
definePageMeta({ middleware: "tenant-admin-auth" });

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useNuxtApp, useRoute } from "#app";

type Category = {
  id: string;
  name: string;
  description: string;
};

type Knowledge = {
  id: string;
  question: string;
  answer: string;
  category_ids: string[];
};

const { $db } = useNuxtApp();
const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId || ""));

const categories = ref<Category[]>([]);
const knowledgeBase = ref<Knowledge[]>([]);

const loading = ref(true);
const saving = ref(false);
const error = ref("");

const selectedId = ref<string | null>(null);
const search = ref("");

const form = reactive({
  question: "",
  answer: "",
  category_ids: [] as string[],
});

const isEditing = computed(() => Boolean(selectedId.value));

const resetForm = () => {
  selectedId.value = null;
  form.question = "";
  form.answer = "";
  form.category_ids = [];
  error.value = "";
};

const startEdit = (k: Knowledge) => {
  selectedId.value = k.id;
  form.question = k.question || "";
  form.answer = k.answer || "";
  form.category_ids = Array.isArray(k.category_ids) ? [...k.category_ids] : [];
  error.value = "";
};

const toggleCategory = (id: string) => {
  if (form.category_ids.includes(id)) {
    form.category_ids = form.category_ids.filter((x) => x !== id);
  } else {
    form.category_ids = [...form.category_ids, id];
  }
};

const validate = () => {
  error.value = "";
  if (!form.question.trim()) {
    error.value = "質問文は必須です";
    return false;
  }
  if (!form.answer.trim()) {
    error.value = "回答文は必須です";
    return false;
  }
  if (form.category_ids.length === 0) {
    error.value = "関連カテゴリを1つ以上選択してください";
    return false;
  }
  return true;
};

const save = async () => {
  if (!validate()) return;
  saving.value = true;
  try {
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category_ids: [...form.category_ids],
    };

    if (selectedId.value) {
      await updateDoc(
        doc(
          $db as any,
          "tenants",
          tenantId.value,
          "knowledge_base",
          selectedId.value
        ),
        payload
      );
    } else {
      await addDoc(
        collection($db as any, "tenants", tenantId.value, "knowledge_base"),
        payload
      );
    }
    resetForm();
  } catch (e) {
    console.error(e);
    error.value = "保存に失敗しました";
  } finally {
    saving.value = false;
  }
};

const remove = async (k: Knowledge) => {
  const ok = confirm(`Q&Aを削除しますか？\n\nQ: ${k.question}`);
  if (!ok) return;
  try {
    await deleteDoc(
      doc($db as any, "tenants", tenantId.value, "knowledge_base", k.id)
    );
    if (selectedId.value === k.id) resetForm();
  } catch (e) {
    console.error(e);
    alert("削除に失敗しました");
  }
};

const categoriesById = computed(() => {
  const m = new Map<string, Category>();
  for (const c of categories.value) m.set(c.id, c);
  return m;
});

const filteredKnowledge = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = knowledgeBase.value.slice();
  if (!q) return list;
  return list.filter((k) => {
    const hit =
      (k.question || "").toLowerCase().includes(q) ||
      (k.answer || "").toLowerCase().includes(q) ||
      (k.category_ids || []).some((cid) =>
        (categoriesById.value.get(cid)?.name || "").toLowerCase().includes(q)
      );
    return hit;
  });
});

let unsubCategories: null | (() => void) = null;
let unsubKnowledge: null | (() => void) = null;

onMounted(() => {
  loading.value = true;

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

  unsubKnowledge = onSnapshot(
    query(collection($db as any, "tenants", tenantId.value, "knowledge_base")),
    (snap) => {
      knowledgeBase.value = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Knowledge[];
      loading.value = false;
    },
    (err) => {
      console.error(err);
      loading.value = false;
      error.value = "Q&Aの取得に失敗しました";
    }
  );
});

onBeforeUnmount(() => {
  unsubCategories?.();
  unsubKnowledge?.();
});
</script>

<template>
  <TenantAdminShell>
    <section class="clientAdminKnowledge">
      <div class="clientAdminKnowledgeInner flex flex-col gap-4">
        <section class="clientAdminKnowledgeHeader">
          <div class="clientAdminKnowledgeHeaderInner">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-academic-cap"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="clientAdminKnowledgeTitle text-base font-bold">
                    ナレッジベース管理（Q&A Editor）
                  </h2>
                </div>
              </template>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                AIが参照する「唯一の正解ソース」です。質問はユーザーの言い回しで、回答はコピペできる文章で作ると強いです。
              </p>
            </UCard>
          </div>
        </section>

        <section class="clientAdminKnowledgeBody">
          <div class="clientAdminKnowledgeBodyInner flex flex-col gap-4">
            <section class="clientAdminKnowledgeEditor">
              <div class="clientAdminKnowledgeEditorInner">
                <UCard>
                  <template #header>
                    <div class="flex items-center justify-between gap-3">
                      <h3 class="text-sm font-bold">
                        {{ isEditing ? "編集" : "新規追加" }}
                      </h3>
                      <div class="flex items-center gap-2">
                        <UButton
                          v-if="isEditing"
                          color="neutral"
                          variant="ghost"
                          icon="i-heroicons-x-mark"
                          @click="resetForm"
                        >
                          キャンセル
                        </UButton>
                        <UButton
                          color="primary"
                          :loading="saving"
                          icon="i-heroicons-check-badge"
                          @click="save"
                        >
                          保存
                        </UButton>
                      </div>
                    </div>
                  </template>

                  <div class="flex flex-col gap-4">
                    <UFormGroup
                      label="質問文"
                      required
                      :error="error || undefined"
                    >
                      <UInput
                        v-model="form.question"
                        placeholder="例：解約方法を教えてください"
                        class="w-full"
                      />
                    </UFormGroup>

                    <UFormGroup label="回答文" required>
                      <textarea
                        v-model="form.answer"
                        class="w-full min-h-32 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="例：マイページの「契約設定」→「解約」からお手続きいただけます。"
                      />
                    </UFormGroup>

                    <UFormGroup label="関連カテゴリ（複数選択可）" required>
                      <div class="flex flex-col gap-2">
                        <div
                          v-if="categories.length === 0"
                          class="text-xs text-gray-500"
                        >
                          先に「カテゴリ管理」でカテゴリを作成してください。
                        </div>
                        <div v-else class="flex flex-wrap gap-2">
                          <label
                            v-for="c in categories"
                            :key="c.id"
                            class="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                          >
                            <input
                              type="checkbox"
                              :checked="form.category_ids.includes(c.id)"
                              class="accent-primary-600"
                              @change="toggleCategory(c.id)"
                            />
                            <span class="font-medium">{{ c.name }}</span>
                          </label>
                        </div>
                        <p v-if="error" class="text-xs text-red-600">
                          {{ error }}
                        </p>
                      </div>
                    </UFormGroup>
                  </div>
                </UCard>
              </div>
            </section>

            <section class="clientAdminKnowledgeList">
              <div class="clientAdminKnowledgeListInner">
                <UCard>
                  <template #header>
                    <div class="flex items-center justify-between gap-3">
                      <h3 class="text-sm font-bold">Q&A一覧</h3>
                      <div class="flex items-center gap-2">
                        <UInput
                          v-model="search"
                          size="xs"
                          placeholder="キーワード検索（質問/回答/カテゴリ）"
                          icon="i-heroicons-magnifying-glass"
                        />
                        <UBadge size="xs" variant="subtle" color="neutral">
                          {{ filteredKnowledge.length }}件
                        </UBadge>
                      </div>
                    </div>
                  </template>

                  <div v-if="loading" class="p-6 text-center">
                    <USpin class="mx-auto" />
                  </div>
                  <div v-else class="flex flex-col gap-2">
                    <div
                      v-for="k in filteredKnowledge"
                      :key="k.id"
                      class="clientAdminKnowledgeListItem flex flex-col gap-2 rounded-md border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-950"
                      :class="
                        selectedId === k.id ? 'ring-2 ring-primary-500/40' : ''
                      "
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-bold">
                            <span class="text-primary-600 font-black">Q.</span>
                            {{ k.question }}
                          </p>
                          <p
                            class="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-1"
                          >
                            <span class="text-gray-500 font-black">A.</span>
                            {{ k.answer }}
                          </p>
                          <div class="flex flex-wrap gap-1 mt-2">
                            <UBadge
                              v-for="cid in k.category_ids || []"
                              :key="cid"
                              size="xs"
                              variant="subtle"
                              color="primary"
                            >
                              {{ categoriesById.get(cid)?.name || cid }}
                            </UBadge>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-pencil-square"
                            @click="startEdit(k)"
                          >
                            編集
                          </UButton>
                          <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-heroicons-trash"
                            @click="remove(k)"
                          >
                            削除
                          </UButton>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="filteredKnowledge.length === 0"
                      class="p-8 text-center text-sm text-gray-500"
                    >
                      表示できるQ&Aがありません。まずは1件登録してみましょう。
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
