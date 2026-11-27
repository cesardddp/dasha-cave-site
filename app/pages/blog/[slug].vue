<script setup lang="ts">
import { marked } from 'marked'

// Detalhe do post via GraphQL (useBlogPost → /api/graphql).
const route = useRoute()
const slug = route.params.slug as string
const { data: post, error } = await useBlogPost(slug)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, message: 'Not Found', message: 'Post não encontrado', fatal: true })
}

const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')
const deleting = ref(false)
const actionError = ref('')

const html = computed(() => marked.parse(post.value?.content ?? '', { async: false }))

const authors = computed(() => [
  {
    name: post.value?.author.name ?? 'Dasha',
    description: post.value?.author.bio ?? undefined,
    avatar: { src: post.value?.author.name === 'Dasha' || !post.value?.author.avatar ? '/imagens/dasha_icon.webp' : post.value.author.avatar },
  },
])

async function editPost() {
  await navigateTo({ path: '/blog', query: { editar: slug } })
}

async function deletePost() {
  if (deleting.value) return
  deleting.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/posts/${slug}`, { method: 'DELETE' })
    await navigateTo('/blog')
  }
  catch (err) {
    actionError.value = getErrorMessage(err, 'Não foi possível apagar o post.')
  }
  finally {
    deleting.value = false
  }
}

useSeoMeta({
  title: () => `${post.value?.title ?? 'Blog'} — Dasha Cave`,
  description: () => post.value?.description ?? '',
})
</script>

<template>
  <main v-if="post" class="post-page">
    <div class="post-page__toolbar">
      <NuxtLink class="post-page__back" to="/blog">
        ← Todos os posts
      </NuxtLink>

      <BlogPostMenu
        v-if="isAdmin"
        :post="post"
        @edit="editPost"
        @delete="deletePost"
      />
    </div>

    <p v-if="actionError" class="post-page__error" role="alert">
      {{ actionError }}
    </p>

    <UBlogPost
      :title="post.title"
      :description="post.description"
      :date="post.publishedAt"
      :badge="post.badge ?? undefined"
      :image="post.image ?? undefined"
      :authors="authors"
      variant="soft"
    >
      <template #body>
        <div class="post-page__content" v-html="html" />
      </template>
    </UBlogPost>
  </main>
</template>

<style scoped>
.post-page {
  box-sizing: border-box;
  width: min(100%, 820px);
  margin: 0 auto;
  padding: 2.5rem 1rem 4rem;
  color: #fff;
}

.post-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.post-page__back {
  display: inline-block;
  color: #00ffaa;
  font-size: 0.9rem;
  text-decoration: none;
}

.post-page__back:hover {
  text-decoration: underline;
}

.post-page__error {
  margin: 0 0 1rem;
  color: #ff6b6b;
  font-size: 0.9rem;
}

.post-page__content {
  line-height: 1.7;
}

.post-page__content :deep(h2) {
  margin: 1.75rem 0 0.75rem;
  font-size: 1.5rem;
}

.post-page__content :deep(h3) {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.2rem;
}

.post-page__content :deep(p) {
  margin: 0 0 1rem;
}

.post-page__content :deep(ul),
.post-page__content :deep(ol) {
  margin: 0 0 1rem 1.25rem;
  padding-left: 1rem;
}

.post-page__content :deep(li) {
  margin-bottom: 0.35rem;
}

.post-page__content :deep(blockquote) {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  border-left: 3px solid #c8102e;
  background: rgb(255 255 255 / 5%);
  font-style: italic;
}

.post-page__content :deep(a) {
  color: #00ffaa;
}
</style>
