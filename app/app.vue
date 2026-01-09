<script setup>
import { onMounted } from "vue";

onMounted(async () => {
  try {
    // クライアント側でインポートして初期化を走らせる
    const { initFirebase } = await import("../src/lib/firebase");
    const app = initFirebase();
    console.log("🔥 Firebase Client SDK 初期化成功:", app.name);
  } catch (e) {
    console.error("❌ Firebase Client SDK 初期化失敗:", e);
  }
});
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
