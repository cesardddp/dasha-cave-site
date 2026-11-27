<script setup lang="ts">
const props = defineProps<{
  post: { slug: string, title: string }
  editing?: boolean
}>()

const emit = defineEmits<{
  edit: [slug: string]
  delete: [slug: string]
}>()

const items = computed(() => [[
  {
    label: 'Editar post',
    icon: 'i-lucide-pencil',
    disabled: props.editing,
    onSelect: () => emit('edit', props.post.slug),
  },
  {
    label: 'Apagar post',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => {
      if (window.confirm(`Apagar "${props.post.title}"? Essa ação não pode ser desfeita.`)) {
        emit('delete', props.post.slug)
      }
    },
  },
]])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton
      icon="i-lucide-ellipsis-vertical"
      color="neutral"
      variant="ghost"
      size="sm"
      class="post-menu__trigger"
      :aria-label="`Ações do post ${post.title}`"
    />
  </UDropdownMenu>
</template>

<style scoped>
.post-menu__trigger {
  color: rgb(255 255 255 / 60%);
}

.post-menu__trigger:hover {
  color: #00ffaa;
}
</style>
