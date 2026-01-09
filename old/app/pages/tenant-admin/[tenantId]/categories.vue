<script setup lang="ts">
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useNuxtApp, useRoute } from "#app";
import TenantAdminShell from "~/components/tenant-admin/TenantAdminShell.vue";
definePageMeta({ middleware: "tenant-admin-auth" });

type Category = {
  id: string;
  name: string;
  description: string;
};

const { $db } = useNuxtApp();
const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId || ""));

const loading = ref(true);
const saving = ref(false);
const categories = ref<Category[]>([]);
const selectedId = ref<string | null>(null);
const error = ref<string>("");

const form = reactive({
  name: "",
  description: "",
});

const isEditing = computed(() => Boolean(selectedId.value));
const descriptionLen = computed(() => (form.description || "").length);
const descriptionOver = computed(() => descriptionLen.value > 350);

const resetForm = () => {
  selectedId.value = null;
  form.name = "";
  form.description = "";
  error.value = "";
};

const startEdit = (c: Category) => {
  selectedId.value = c.id;
  form.name = c.name;
  form.description = c.description || "";
  error.value = "";
};

const validate = () => {
  error.value = "";
  if (!form.name.trim()) {
    error.value = "カテゴリ名は必須です";
    return false;
  }
  if (descriptionOver.value) {
    error.value = "説明文は最大350文字です";
    return false;
  }
  return true;
};

const save = async () => {
  if (!validate()) return;
  saving.value = true;
  try {
    const name = form.name.trim();
    const description = form.description.trim();
    if (selectedId.value) {
      await updateDoc(
        doc(
          $db as any,
          "tenants",
          tenantId.value,
          "categories",
          selectedId.value
        ),
        { name, description }
      );
    } else {
      await addDoc(
        collection($db as any, "tenants", tenantId.value, "categories"),
        {
          name,
          description,
        }
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

const remove = async (c: Category) => {
  const ok = confirm(
    `カテゴリ「${c.name}」を削除しますか？\n※紐付いているQ&Aがある場合、参照IDが残ります。`
  );
  if (!ok) return;
  try {
    await deleteDoc(
      doc($db as any, "tenants", tenantId.value, "categories", c.id)
    );
    if (selectedId.value === c.id) resetForm();
  } catch (e) {
    console.error(e);
    alert("削除に失敗しました");
  }
};

let unsub: null | (() => void) = null;

onMounted(() => {
  loading.value = true;
  const q = query(
    collection($db as any, "tenants", tenantId.value, "categories"),
    orderBy("name", "asc")
  );
  unsub = onSnapshot(
    q,
    (snap) => {
      categories.value = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Category[];
      loading.value = false;
    },
    (err) => {
      console.error(err);
      loading.value = false;
      error.value = "カテゴリの取得に失敗しました";
    }
  );
});

onBeforeUnmount(() => {
  unsub?.();
});
</script>

<template>
  <TenantAdminShell>
    <section class="clientAdminCategories">
      <div class="clientAdminCategoriesInner flex flex-col gap-4">
        <section class="clientAdminCategoriesHeader">
          <div class="clientAdminCategoriesHeaderInner">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-tag"
                    class="w-5 h-5 text-primary-500"
                  />
                  <h2 class="clientAdminCategoriesTitle text-base font-bold">
                    カテゴリ管理
                  </h2>
                </div>
              </template>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                AIのカテゴリ判定の精度に直結します。説明文には「具体的なキーワード例」を含めるのがコツです（最大350文字）。
              </p>
            </UCard>
          </div>
        </section>

        <section class="clientAdminCategoriesBody">
          <div class="clientAdminCategoriesBodyInner flex flex-col gap-4">
            <section class="clientAdminCategoriesEditor">
              <div class="clientAdminCategoriesEditorInner">
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
                      label="カテゴリ名"
                      required
                      :error="error || undefined"
                    >
                      <UInput
                        v-model="form.name"
                        placeholder="例：料金・プラン / 契約 / 解約 など"
                        class="w-full"
                      />
                    </UFormGroup>

                    <UFormGroup
                      label="説明文（最大350文字）"
                      :error="
                        descriptionOver ? '350文字を超えています' : undefined
                      "
                    >
                      <div class="flex flex-col gap-2">
                        <textarea
                          v-model="form.description"
                          class="w-full min-h-28 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="例：料金、月額、年額、見積、無料トライアル、初期費用、請求、支払い方法…など、ユーザーが使いそうな単語を具体的に"
                        />
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-xs text-gray-500">
                            文字数：<span
                              :class="
                                descriptionOver ? 'text-rose-600 font-bold' : ''
                              "
                              >{{ descriptionLen }}</span
                            >/350
                          </p>
                          <p v-if="error" class="text-xs text-rose-600">
                            {{ error }}
                          </p>
                        </div>
                      </div>
                    </UFormGroup>
                  </div>
                </UCard>
              </div>
            </section>

            <section class="clientAdminCategoriesList">
              <div class="clientAdminCategoriesListInner">
                <UCard>
                  <template #header>
                    <div class="flex items-center justify-between gap-3">
                      <h3 class="text-sm font-bold">カテゴリ一覧</h3>
                      <UBadge size="xs" variant="subtle" color="neutral">
                        {{ categories.length }}件
                      </UBadge>
                    </div>
                  </template>

                  <div v-if="loading" class="p-6 text-center">
                    <USpin class="mx-auto" />
                  </div>
                  <div v-else class="flex flex-col gap-2">
                    <div
                      v-for="c in categories"
                      :key="c.id"
                      class="clientAdminCategoriesListItem flex flex-col gap-2 rounded-md border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-950"
                      :class="
                        selectedId === c.id ? 'ring-2 ring-primary-500/40' : ''
                      "
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="font-bold text-sm truncate">{{ c.name }}</p>
                          <p class="text-xs text-gray-500 font-mono break-all">
                            ID: {{ c.id }}
                          </p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-pencil-square"
                            @click="startEdit(c)"
                          >
                            編集
                          </UButton>
                          <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-heroicons-trash"
                            @click="remove(c)"
                          >
                            削除
                          </UButton>
                        </div>
                      </div>
                      <p
                        class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap"
                      >
                        {{ c.description || "（説明文なし）" }}
                      </p>
                    </div>

                    <div
                      v-if="categories.length === 0"
                      class="p-8 text-center text-sm text-gray-500"
                    >
                      まだカテゴリがありません。まずは1つ作ってみましょう。
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
