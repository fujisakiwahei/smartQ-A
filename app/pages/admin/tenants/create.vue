<script setup lang="ts">
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref } from "vue";
import { useNuxtApp, useRouter } from "#app";
import { COLOR_OPTIONS } from "~/utils/constants";

const { $db } = useNuxtApp();
const router = useRouter();

// フォームの状態
const form = ref({
  name: "",
  allowed_domains: ["", "", ""],
  theme_color: "basic",
});

const isSubmitting = ref(false);

// テーマカラーの選択肢
const colorOptions = COLOR_OPTIONS;

// テナント登録処理
const handleCreateTenant = async () => {
  if (!form.value.name) return;

  isSubmitting.value = true;
  try {
    // 空文字を除去して配列を整形
    const domains = form.value.allowed_domains
      .map((d) => d.trim())
      .filter((d) => d !== "");

    await addDoc(collection($db, "tenants"), {
      name: form.value.name,
      allowed_domains: domains,
      theme_color: form.value.theme_color,
      created_at: serverTimestamp(),
    });

    router.push("/admin/tenants");
  } catch (error) {
    console.error("Tenant creation error:", error);
    alert("登録に失敗しました");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
    <div class="max-w-lg mx-auto">
      <UButton
        to="/admin/tenants"
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="neutral"
        class="mb-4"
      >
        企業一覧に戻る
      </UButton>

      <UCard>
        <template #header>
          <h1 class="text-xl font-bold flex items-center gap-2">
            <UIcon name="i-heroicons-plus-circle" class="text-primary-500" />
            新規企業登録
          </h1>
        </template>

        <form @submit.prevent="handleCreateTenant" class="space-y-8">
          <!-- 企業名セクション -->
          <section class="space-y-3">
            <div>
              <div
                class="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                <UBadge size="xs" color="primary" variant="subtle"
                  >STEP 1</UBadge
                >
                <span>企業名を設定</span>
              </div>
              <UFormGroup
                label="企業名"
                required
                description="契約企業名を入力してください（例: 合同会社Saki）"
              >
                <UInput
                  v-model="form.name"
                  placeholder="企業名を入力してください"
                  class="w-full h-10 flex"
                />
              </UFormGroup>
            </div>
          </section>

          <!-- 許可ドメインセクション -->
          <section class="space-y-3">
            <div>
              <div
                class="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                <UBadge size="xs" color="primary" variant="subtle"
                  >STEP 2</UBadge
                >
                <span>許可ドメインを設定（プロトコルなし）</span>
              </div>
              <UFormGroup
                label="許可ドメイン"
                description="ウィジェットを表示を許可するドメイン（最大3つまで）"
              >
                <div class="space-y-2 flex flex-col gap-3">
                  <UInput
                    v-for="(domain, index) in form.allowed_domains"
                    :key="index"
                    v-model="form.allowed_domains[index]"
                    :placeholder="`domain${index + 1}.com`"
                    icon="i-heroicons-globe-alt"
                    class="w-full"
                  />
                </div>
              </UFormGroup>
            </div>
          </section>

          <!-- テーマカラーセクション -->
          <section class="space-y-3">
            <div>
              <div
                class="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                <UBadge size="xs" color="primary" variant="subtle"
                  >STEP 3</UBadge
                >
                <span>テーマカラーを選択</span>
              </div>
              <UFormGroup
                label="テーマカラー"
                description="チャットウィジェットのメインカラーを選択してください"
              >
                <div class="flex flex-wrap gap-3 pt-2">
                  <div
                    v-for="color in colorOptions"
                    :key="color.value"
                    class="group relative w-8 h-8 rounded shadow-sm cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center"
                    :class="[
                      color.hex,
                      form.theme_color === color.value
                        ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-950 scale-110'
                        : 'opacity-80 hover:opacity-100',
                    ]"
                    @click="form.theme_color = color.value"
                  >
                    <UIcon
                      v-if="form.theme_color === color.value"
                      name="i-heroicons-check"
                      class="text-white w-5 h-5 drop-shadow-md"
                    />
                    <span
                      class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                    >
                      {{ color.label }}
                    </span>
                  </div>
                </div>
              </UFormGroup>
            </div>
          </section>

          <div
            class="w-fit mt-6 mx-auto flex justify-end gap-3 dark:border-gray-800"
          >
            <UButton to="/admin/tenants" variant="ghost" color="neutral">
              キャンセル
            </UButton>
            <UButton
              type="submit"
              size="lg"
              :loading="isSubmitting"
              icon="i-heroicons-check-badge"
            >
              登録を完了する
            </UButton>
          </div>
        </form>
      </UCard>
    </div>
  </div>
</template>
