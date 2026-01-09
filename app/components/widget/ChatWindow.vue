<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  isLoading: boolean;
}>();

const emit = defineEmits(["close", "send"]);
const input = ref("");

const sendMessage = () => {
  if (!input.value.trim()) return;
  emit("send", input.value);
  input.value = "";
};
</script>

<template>
  <div
    class="flex flex-col h-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-blue-600 text-white">
      <h3 class="font-bold text-lg">Chat Support</h3>
      <button @click="$emit('close')" class="p-1 hover:bg-blue-700 rounded">
        <Icon name="lucide:x" class="w-6 h-6" />
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[80%] rounded-lg px-4 py-2"
          :class="
            msg.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800'
          "
        >
          {{ msg.content }}
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-gray-100 rounded-lg px-4 py-2 flex space-x-1">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div
            class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"
          ></div>
          <div
            class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"
          ></div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-gray-200 bg-gray-50">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input
          v-model="input"
          type="text"
          placeholder="Ask a question..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
        />
        <button
          type="submit"
          class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          :disabled="!input.trim() || isLoading"
        >
          <Icon name="lucide:send" class="w-5 h-5" />
        </button>
      </form>
    </div>
  </div>
</template>
