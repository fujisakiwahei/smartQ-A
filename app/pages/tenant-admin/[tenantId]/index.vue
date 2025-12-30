<script setup lang="ts">
await navigateTo({
  path: `/tenant-admin/${String(useRoute().params.tenantId)}/dashboard`,
});
</script>

<template>
  <div class="tenantAdminRedirect">
    <div class="tenantAdminRedirectInner">
      <span>Redirecting...</span>
    </div>
  </div>
</template>
