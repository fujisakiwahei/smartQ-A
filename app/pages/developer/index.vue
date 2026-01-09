<script setup lang="ts">
// 開発者専用ミドルウェアを適用
definePageMeta({
  middleware: "developer-only",
});

const { adminUser } = useAdminSession();

import { getFirestore, doc, setDoc, getDocs, serverTimestamp, collection } from "firebase/firestore";
import { initFirebase } from "../../../src/lib/firebase";
import type { Tenants } from "../../types/tenant";

const app = initFirebase();
const db = getFirestore(app);

// テナント作成用
const tenantUid = ref("");
const tenantName = ref("");
const isDeveloper = ref(false);
const themeColor = ref("");
const allowedDomains1 = ref("");
const allowedDomains2 = ref("");
const allowedDomains = ref<string[] | null>(null);
const isSubmitting = ref(false);
const createTenant = async () => {
  isSubmitting.value = true;

  if (!tenantUid.value || !tenantName.value || !themeColor.value || !allowedDomains1.value) {
    alert("すべての項目を入力してください");
    isSubmitting.value = false;
    return;
  }

  if (allowedDomains1.value && allowedDomains2.value) {
    allowedDomains.value = [allowedDomains1.value, allowedDomains2.value];
  } else if (allowedDomains1.value) {
    allowedDomains.value = [allowedDomains1.value];
  } else {
    alert("許可ドメインを入力してください");
    isSubmitting.value = false;
    return;
  }

  try {
    await setDoc(doc(db, "tenants", tenantUid.value), {
      tenant_name: tenantName.value,
      theme_color: themeColor.value,
      allowed_domains: allowedDomains.value,
      is_developer: isDeveloper.value,
      created_at: serverTimestamp(),
      categories: [],
      knowledge_bases: [],
    });
  } catch (error) {
    console.error("テナント作成に失敗しました:", error);
    alert("テナント作成に失敗しました");
    isSubmitting.value = false;
    return;
  }

  isSubmitting.value = false;
  alert("テナント作成に成功しました");
  tenantUid.value = "";
  tenantName.value = "";
  themeColor.value = "";
  allowedDomains1.value = "";
  allowedDomains2.value = "";
  isDeveloper.value = false;
};

// テナント一覧用
const tenantList = ref<Tenants>([]);
const getTenantList = async () => {
  const snapshot = await getDocs(collection(db, "tenants"));

  // push ではなく、配列を丸ごと新しいデータで上書きする
  tenantList.value = snapshot.docs.map((doc) => ({
    tenant_id: doc.id,
    tenant_name: doc.data().tenant_name,
    allowed_domains: doc.data().allowed_domains,
    is_developer: doc.data().is_developer,
    created_at: doc.data().created_at,
    theme_color: doc.data().theme_color,
  }));
};

onMounted(async () => {
  await getTenantList();
});
</script>

<template>
  <section class="developer">
    <div class="developerInner container mx-auto p-8">
      <h1 class="text-3xl font-bold mb-6">🛠️ 開発者専用管理画面</h1>

      <!-- ログイン情報セクション -->
      <div class="developerInfo bg-white shadow rounded-lg p-6 mb-8">
        <h2 class="developerInfoTitle text-xl font-semibold mb-4">ログイン情報</h2>
        <p class="text-gray-600">メールアドレス: {{ adminUser?.email }}</p>
        <p class="text-gray-600">テナントID: {{ adminUser?.tenant_id }}</p>
        <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2"> Developer Mode </span>
      </div>

      <!-- 新規テナント作成セクション -->
      <section class="tenantCreate bg-white shadow rounded-lg p-6">
        <div class="tenantCreateInner">
          <h2 class="tenantCreateTitle text-xl font-semibold mb-6">新規テナント作成</h2>

          <form class="tenantCreateForm space-y-6" @submit.prevent="createTenant">
            <!-- テナントUID -->
            <div class="tenantCreateItem flex flex-col">
              <label class="tenantCreateItemLabel text-sm font-medium text-gray-700 mb-1"> テナントUID <span class="text-red-500 text-xs">*必須 (Firebase AuthのUIDをコピペ)</span> </label>
              <input v-model="tenantUid" type="text" required placeholder="abc123xyz..." class="tenantCreateItemInput border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <!-- テナント名 -->
            <div class="tenantCreateItem flex flex-col">
              <label class="tenantCreateItemLabel text-sm font-medium text-gray-700 mb-1"> テナント名 <span class="text-red-500 text-xs">*必須</span> </label>
              <input v-model="tenantName" type="text" required placeholder="株式会社サンプル" class="tenantCreateItemInput border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <!-- テーマカラー -->
            <div class="tenantCreateItem flex flex-col">
              <label class="tenantCreateItemLabel text-sm font-medium text-gray-700 mb-1"> テーマカラー <span class="text-red-500 text-xs">*必須</span></label>
              <input v-model="themeColor" type="text" placeholder="blue" class="tenantCreateItemInput border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <!-- 許可ドメイン -->
            <div class="tenantCreateItem flex flex-col">
              <label class="tenantCreateItemLabel text-sm font-medium text-gray-700 mb-1"> 許可ドメイン <span class="text-red-500 text-xs">*必須（2つまで入力可）</span></label>
              <div class="flex gap-2">
                <input v-model="allowedDomains1" type="text" placeholder="localhost:3000" class="tenantCreateItemInput flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <input v-model="allowedDomains2" type="text" placeholder="example.com" class="tenantCreateItemInput flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>

            <!-- 開発者用テナントとして作成する -->
            <div class="tenantCreateItem flex items-center gap-3 py-2">
              <input id="is-developer" v-model="isDeveloper" type="checkbox" class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label for="is-developer" class="tenantCreateItemLabel text-sm font-medium text-gray-700 cursor-pointer"> 開発者用テナントとして作成する <br /><span class="text-gray-400 text-xs">(チェックすると全権限を持ちます)</span> </label>
            </div>

            <!-- 送信ボタン -->
            <div class="tenantCreateAction pt-4">
              <button @click="createTenant" type="submit" :disabled="isSubmitting" class="tenantCreateButton w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400">
                {{ isSubmitting ? "作成中..." : "テナントを新規作成する" }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- テナント一覧セクション -->
      <section class="tenantList bg-white shadow rounded-lg p-6 mt-8">
        <h2 class="tenantListTitle text-xl font-semibold mb-6">テナント一覧</h2>
        <div class="tenantListInner">
          <table class="tenantListTable w-full">
            <thead>
              <tr>
                <th class="tenantListTableHeader text-left text-gray-400">テナント名</th>
                <th class="tenantListTableHeader text-left text-gray-400">テナントID</th>
                <th class="tenantListTableHeader text-left text-gray-400">テーマカラー</th>
                <th class="tenantListTableHeader text-left text-gray-400">許可ドメイン</th>
                <th class="tenantListTableHeader text-left text-gray-400">開発者用テナント</th>
                <th class="tenantListTableHeader text-left text-gray-400">作成日時</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tenant in tenantList" :key="tenant.tenant_id" class="">
                <td class="tenantListTableCell border-b border-blue-100 py-4 text-left text-lg font-bold text-blue-500">{{ tenant.tenant_name }}</td>
                <td class="tenantListTableCell border-b border-blue-100 py-4 text-left">{{ tenant.tenant_id }}</td>
                <td class="tenantListTableCell border-b border-blue-100 py-4 text-left">{{ tenant.theme_color }}</td>
                <td class="tenantListTableCell border-b border-blue-100 py-4 text-left">{{ tenant.allowed_domains?.[0] || "-" }}</td>
                <td class="tenantListTableCell border-b border-blue-100 py-4 text-left">{{ tenant.is_developer ? "✅" : "-" }}</td>
                <td class="tenantListTableCell border-b border-blue-100 py-4 text-left">{{ tenant.created_at.toDate().toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>
