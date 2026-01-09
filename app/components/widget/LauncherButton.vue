<script setup lang="ts">
defineEmits(["toggle"]);
</script>

<template>
  <button
    class="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
    @click="$emit('toggle')"
  >
    <Icon name="lucide:message-circle" class="w-8 h-8" />
  </button>
</template>
