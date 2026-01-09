<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import LauncherButton from "@/components/widget/LauncherButton.vue";
import ChatWindow from "@/components/widget/ChatWindow.vue";

const route = useRoute();
const tenantId = route.query.tenant_id as string;

// State
const isOpen = ref(false);
const messages = ref<Array<{ role: "user" | "assistant"; content: string }>>(
  []
);
const isLoading = ref(false);

// Methods
const toggleWidget = () => {
  isOpen.value = !isOpen.value;
  // Communicate resize to parent
  if (import.meta.client) {
    // Nuxt 4 prefer import.meta.client over process.client
    window.parent.postMessage(
      {
        type: "smart-qa:resize",
        mode: isOpen.value ? "open" : "closed",
      },
      "*"
    );
  }
};

const handleSend = async (message: string) => {
  messages.value.push({ role: "user", content: message });
  isLoading.value = true;

  try {
    const { response } = await $fetch("/api/chat", {
      method: "POST",
      body: {
        tenant_id: tenantId,
        message,
        history: messages.value,
      },
    });

    messages.value.push({ role: "assistant", content: response });
  } catch (e) {
    messages.value.push({
      role: "assistant",
      content: "Sorry, something went wrong.",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="h-full flex flex-col items-end justify-end p-0 overflow-hidden">
    <!-- Chat Window -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div v-if="isOpen" class="w-full h-full pb-4">
        <!-- Padding for separation -->
        <ChatWindow
          :messages="messages"
          :is-loading="isLoading"
          @close="toggleWidget"
          @send="handleSend"
        />
      </div>
    </transition>

    <!-- Launcher -->
    <div v-if="!isOpen" class="absolute bottom-0 right-0">
      <LauncherButton @toggle="toggleWidget" />
    </div>
  </div>
</template>

<style>
/* Ensure the Nuxt page takes full iframe height */
html,
body,
#__nuxt {
  height: 100%;
  margin: 0;
  background: transparent; /* allow rounded corners transparency */
}
</style>
