<script setup lang="ts">
import { marked } from 'marked'
import { parseBadges } from '~~/shared/utils/badges'

// Consome via GraphQL (useBlogPosts → /api/graphql). A listagem é um feed
// estilo rede social: cada post é um bloco vertical com avatar, autor,
// data e conteúdo completo em Markdown — sem truncamento.
const { data: posts, status, error: postsError, refresh: refreshPosts } = await useBlogPosts()

// Compositor inline: só admin cria posts. O endpoint já rejeita não-admin
// no servidor; isto apenas evita mostrar o formulário para quem não pode usar.
const { loggedIn, user } = useUserSession()
const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')

const draft = reactive({ title: '', description: '', content: '', badge: '', image: '' })
// Prévia dos badges: o campo guarda tudo junto, separado por espaço.
const draftBadges = computed(() => parseBadges(draft.badge))
const submitting = ref(false)
const composerError = ref('')
const editingSlug = ref<string | null>(null)
const composerRef = ref<HTMLElement | null>(null)

// Imagem do post: upload próprio ou reaproveitamento do bucket, igual ao editor de livros.
interface PostImageAsset {
  filename: string
  url: string
}

const imageAssets = ref<PostImageAsset[]>([])
const imageBucketOpen = ref(false)
const bucketLoading = ref(false)
const uploadingImage = ref(false)
const imageError = ref('')

async function uploadImage(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return

  uploadingImage.value = true
  imageError.value = ''
  try {
    const formData = new FormData()
    formData.append('image', input.files[0])
    const response = await $fetch<{ image: string }>('/api/posts/image', {
      method: 'POST',
      body: formData,
    })
    draft.image = response.image
    if (imageBucketOpen.value) await loadImageBucket()
  }
  catch (error) {
    imageError.value = getErrorMessage(error, 'Não foi possível enviar a imagem.')
  }
  finally {
    uploadingImage.value = false
    input.value = ''
  }
}

async function loadImageBucket() {
  bucketLoading.value = true
  imageError.value = ''
  try {
    imageAssets.value = await $fetch<PostImageAsset[]>('/api/posts/images')
  }
  catch (error) {
    imageError.value = getErrorMessage(error, 'Não foi possível carregar as imagens.')
  }
  finally {
    bucketLoading.value = false
  }
}

async function toggleImageBucket() {
  imageBucketOpen.value = !imageBucketOpen.value
  if (imageBucketOpen.value) await loadImageBucket()
}

function selectPostImage(image: PostImageAsset) {
  draft.image = image.url
}

const canSubmit = computed(() =>
  !submitting.value
  && draft.title.trim().length > 0
  && draft.description.trim().length > 0
  && draft.content.trim().length > 0,
)

function resetDraft() {
  Object.assign(draft, { title: '', description: '', content: '', badge: '', image: '' })
  editingSlug.value = null
  composerError.value = ''
}

async function submitPost() {
  if (!canSubmit.value) return
  submitting.value = true
  composerError.value = ''

  const editing = editingSlug.value
  const body = {
    title: draft.title.trim(),
    description: draft.description.trim(),
    content: draft.content.trim(),
    badge: draft.badge.trim() || undefined,
    image: draft.image.trim() || undefined,
  }

  try {
    if (editing) {
      await $fetch(`/api/posts/${editing}`, { method: 'PUT', body })
    }
    else {
      await $fetch('/api/posts', { method: 'POST', body })
    }
    resetDraft()
    await refreshNuxtData('blog-posts')
    if (editing) await refreshNuxtData(`blog-post-${editing}`)
  }
  catch (error) {
    composerError.value = getErrorMessage(error, editing
      ? 'Não foi possível salvar as alterações.'
      : 'Não foi possível publicar o post.')
  }
  finally {
    submitting.value = false
  }
}

function startEditing(post: { slug: string, title: string, description: string, content: string | null, badge: string | null, image: string | null }) {
  Object.assign(draft, {
    title: post.title,
    description: post.description,
    content: post.content ?? '',
    badge: post.badge ?? '',
    image: post.image ?? '',
  })
  editingSlug.value = post.slug
  composerError.value = ''
  composerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function startEditingBySlug(slug: string) {
  const found = posts.value?.find(post => post.slug === slug)
  if (found) startEditing(found)
}

async function deletePost(slug: string) {
  composerError.value = ''
  try {
    await $fetch(`/api/posts/${slug}`, { method: 'DELETE' })
    if (editingSlug.value === slug) resetDraft()
    await refreshNuxtData('blog-posts')
    await refreshNuxtData(`blog-post-${slug}`)
  }
  catch (error) {
    composerError.value = getErrorMessage(error, 'Não foi possível apagar o post.')
  }
}

// Permite abrir a página do post e clicar em "Editar": volta para /blog?editar=slug
// e o compositor já abre preenchido com o post.
const route = useRoute()
const router = useRouter()

async function consumeEditQuery() {
  const target = route.query.editar
  if (typeof target !== 'string' || !isAdmin.value) return

  startEditingBySlug(target)
  await router.replace({ query: {} })
}

onMounted(consumeEditQuery)
watch(() => route.query.editar, consumeEditQuery)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const render = (content: string | null, fallback: string) =>
  marked.parse(content || fallback, { async: false })

useSeoMeta({
  title: 'Blog — Dasha Cave',
  description: 'Reflexões taciturnas e zéfiros soprados pelo pélago.',
})
</script>

<template>
  <main class="blog-page">
    <header class="blog-page__header">
      <NuxtLink class="blog-page__back" to="/">
        ← Voltar
      </NuxtLink>
      <h1 class="blog-page__title">Blog</h1>
      <p class="blog-page__subtitle">
        Reflexões taciturnas e zéfiros soprados pelo pélago.
      </p>
    </header>

    <section v-if="isAdmin" ref="composerRef" class="composer" aria-label="Novo post">
      <h2 class="composer__title">
        {{ editingSlug ? 'Editar post' : 'Novo post' }}
      </h2>

      <UInput v-model="draft.title" placeholder="Título" class="composer__field" />
      <UInput v-model="draft.description" placeholder="Descrição curta" class="composer__field" />
      <UTextarea v-model="draft.content" :rows="6" placeholder="Conteúdo em Markdown…" class="composer__field" />
      <UInput
        v-model="draft.badge"
        placeholder="Badges separados por espaço (opcional)"
        class="composer__field"
      />
      <p v-if="draftBadges.length" class="composer__badges">
        <span v-for="badge in draftBadges" :key="badge" class="feed__badge">{{ badge }}</span>
      </p>

      <div class="composer__image">
        <UInput
          v-model="draft.image"
          placeholder="URL da imagem (opcional)"
          class="composer__field"
        />

        <label class="composer__image-upload">
          <span>Imagem do post (JPEG, PNG ou WebP, até 5 MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="uploadingImage"
            @change="uploadImage"
          >
        </label>

        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :aria-expanded="imageBucketOpen"
          aria-controls="post-image-bucket"
          :disabled="bucketLoading"
          @click="toggleImageBucket"
        >
          {{ imageBucketOpen ? 'Fechar bucket de imagens' : 'Escolher imagem do bucket' }}
        </UButton>

        <div v-if="draft.image" class="composer__image-preview">
          <img :src="draft.image" alt="Prévia da imagem selecionada">
          <div class="composer__image-preview-info">
            <code>{{ draft.image }}</code>
            <UButton color="neutral" variant="ghost" size="xs" @click="draft.image = ''">
              Remover
            </UButton>
          </div>
        </div>

        <p v-if="uploadingImage" class="composer__image-status" role="status">
          Enviando imagem…
        </p>

        <section
          v-if="imageBucketOpen"
          id="post-image-bucket"
          class="composer__image-bucket"
          aria-label="Bucket de imagens de posts"
        >
          <p v-if="bucketLoading" role="status">
            Carregando imagens…
          </p>
          <p v-else-if="!imageAssets.length">
            Ainda não há imagens. Envie uma imagem para começar.
          </p>
          <div v-else class="composer__image-grid">
            <button
              v-for="image in imageAssets"
              :key="image.filename"
              type="button"
              class="composer__image-option"
              :class="{ 'composer__image-option--active': draft.image === image.url }"
              :aria-label="`Selecionar ${image.filename}`"
              :aria-pressed="draft.image === image.url"
              @click="selectPostImage(image)"
            >
              <img :src="image.url" :alt="image.filename" loading="lazy">
              <span>{{ image.filename }}</span>
            </button>
          </div>
        </section>
      </div>

      <p v-if="imageError" class="composer__error">
        {{ imageError }}
      </p>

      <p v-if="composerError" class="composer__error">
        {{ composerError }}
      </p>

      <div class="composer__actions">
        <UButton :disabled="!canSubmit" :loading="submitting" @click="submitPost">
          {{ editingSlug ? 'Salvar alterações' : 'Publicar' }}
        </UButton>
        <UButton
          v-if="editingSlug"
          color="neutral"
          variant="ghost"
          :disabled="submitting"
          @click="resetDraft"
        >
          Cancelar edição
        </UButton>
      </div>
    </section>

    <p v-if="status === 'pending'" class="blog-page__empty">
      Carregando posts…
    </p>

    <div v-else-if="postsError" class="blog-page__empty">
      <p>{{ getErrorMessage(postsError, 'Não foi possível carregar os posts.') }}</p>
      <UButton color="neutral" variant="ghost" @click="refreshPosts()">
        Tentar novamente
      </UButton>
    </div>

    <p v-else-if="!posts?.length" class="blog-page__empty">
      Nenhum post publicado ainda.
    </p>

    <section v-else class="feed" aria-label="Lista de posts">
      <article v-for="post in posts" :key="post.id" class="feed__post">
        <header class="feed__meta">
          <NuxtLink class="feed__author" :to="`/blog/${post.slug}`">
            <NuxtImg
              class="feed__avatar"
              :src="post.author.name === 'Dasha' || !post.author.avatar ? '/imagens/dasha_icon.webp' : post.author.avatar"
              :alt="`Avatar de ${post.author.name}`"
              width="44"
              height="44"
              loading="lazy"
            />
            <span class="feed__author-info">
              <span class="feed__author-name">{{ post.author.name }}</span>
              <time class="feed__date" :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
            </span>
          </NuxtLink>
          <div class="feed__meta-actions">
            <span
              v-for="badge in parseBadges(post.badge)"
              :key="badge"
              class="feed__badge"
            >{{ badge }}</span>
            <BlogPostMenu
              v-if="isAdmin"
              :post="post"
              :editing="editingSlug === post.slug"
              @edit="startEditingBySlug"
              @delete="deletePost"
            />
          </div>
        </header>

        <h2 class="feed__title">
          <NuxtLink class="feed__title-link" :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink>
        </h2>

        <p class="feed__description">{{ post.description }}</p>

        <!-- Conteúdo completo, sem limite de altura -->
        <div class="feed__content" v-html="render(post.content, post.description)" />

        <NuxtImg
          v-if="post.image"
          class="feed__image"
          :src="post.image"
          :alt="post.title"
          loading="lazy"
        />

        <footer class="feed__footer">
          <NuxtLink class="feed__more" :to="`/blog/${post.slug}`">
            Ver página do post →
          </NuxtLink>
        </footer>
      </article>
    </section>
  </main>
</template>

<style scoped>
.blog-page {
  box-sizing: border-box;
  width: min(100%, 680px);
  margin: 0 auto;
  padding: 2.5rem 1rem 4rem;
  color: #fff;
}

.blog-page__header {
  margin-bottom: 2rem;
}

.blog-page__back {
  display: inline-block;
  margin-bottom: 1rem;
  color: #00ffaa;
  font-size: 0.9rem;
  text-decoration: none;
}

.blog-page__back:hover {
  text-decoration: underline;
}

.blog-page__title {
  margin: 0 0 0.5rem;
  font-size: clamp(0.5rem, 3vw, 1.5rem);
  text-shadow: 0 2px 4px rgb(0 0 0 / 60%);
}

.blog-page__subtitle {
  margin: 0;
  color: rgb(255 255 255 / 70%);
}

.blog-page__empty {
  color: rgb(255 255 255 / 70%);
}

.composer {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 14px;
  background: rgb(6 8 9 / 55%);
  margin-bottom: 1.5rem;
}

.composer__title {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}

.composer__field {
  width: 100%;
}

.composer__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
}

.composer__error {
  color: #ff6b6b;
  font-size: 0.85rem;
}

.composer__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.composer__image {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  background: rgb(0 0 0 / 20%);
}

.composer__image-upload {
  display: grid;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgb(255 255 255 / 70%);
}

.composer__image-upload input {
  width: 100%;
  color: rgb(255 255 255 / 80%);
  font-size: 0.8rem;
}

.composer__image-status {
  margin: 0;
  color: rgb(255 255 255 / 70%);
  font-size: 0.8rem;
}

.composer__image-preview {
  display: grid;
  gap: 0.5rem;
}

.composer__image-preview img {
  width: 100%;
  max-height: 220px;
  border-radius: 10px;
  object-fit: cover;
}

.composer__image-preview-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.composer__image-preview-info code {
  overflow-wrap: anywhere;
  font-size: 0.7rem;
  opacity: 0.65;
}

.composer__image-bucket {
  display: grid;
  gap: 0.6rem;
}

.composer__image-bucket > p {
  margin: 0;
  color: rgb(255 255 255 / 70%);
  font-size: 0.8rem;
}

.composer__image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 0.6rem;
}

.composer__image-option {
  display: grid;
  gap: 0.35rem;
  padding: 0.4rem;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 10px;
  background: rgb(255 255 255 / 4%);
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.composer__image-option img {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  object-fit: cover;
}

.composer__image-option span {
  overflow-wrap: anywhere;
  font-size: 0.65rem;
  opacity: 0.7;
}

.composer__image-option:hover,
.composer__image-option--active {
  border-color: #00ffaa;
  background: rgb(0 255 170 / 12%);
}

.feed {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feed__post {
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 14px;
  background: rgb(6 8 9 / 55%);
  padding: 1.25rem 1.25rem 1rem;
}

.feed__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.feed__author {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: inherit;
}

.feed__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.feed__author-info {
  display: flex;
  flex-direction: column;
}

.feed__author-name {
  font-weight: 700;
}

.feed__author:hover .feed__author-name {
  color: #00ffaa;
}

.feed__date {
  font-size: 0.8rem;
  color: rgb(255 255 255 / 60%);
}

.feed__badge {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgb(0 255 170 / 12%);
  color: #00ffaa;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.feed__meta-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
}

.feed__title {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  line-height: 1.3;
}

.feed__title-link {
  color: inherit;
  text-decoration: none;
}

.feed__title-link:hover {
  color: #00ffaa;
}

.feed__description {
  margin: 0 0 0.75rem;
  color: rgb(255 255 255 / 75%);
  line-height: 1.6;
}

.feed__content {
  line-height: 1.7;
  overflow-wrap: break-word;
}

.feed__content :deep(h2) {
  margin: 1.5rem 0 0.6rem;
  font-size: 1.3rem;
}

.feed__content :deep(h3) {
  margin: 1.25rem 0 0.5rem;
  font-size: 1.1rem;
}

.feed__content :deep(p) {
  margin: 0 0 1rem;
}

.feed__content :deep(ul),
.feed__content :deep(ol) {
  margin: 0 0 1rem 1.25rem;
  padding-left: 1rem;
}

.feed__content :deep(li) {
  margin-bottom: 0.35rem;
}

.feed__content :deep(blockquote) {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  border-left: 3px solid #c8102e;
  background: rgb(255 255 255 / 5%);
  font-style: italic;
}

.feed__content :deep(a) {
  color: #00ffaa;
}

.feed__content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}

.feed__image {
  display: block;
  width: 100%;
  height: auto;
  margin: 0.75rem 0;
  border-radius: 10px;
}

.feed__footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgb(255 255 255 / 8%);
}

.feed__more {
  color: #00ffaa;
  font-size: 0.9rem;
  text-decoration: none;
}

.feed__more:hover {
  text-decoration: underline;
}
</style>
