<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Book } from '#shared/types/book'

const { loggedIn, user, fetch: refreshSession } = useUserSession()

interface AmazonBookImportResult {
  book: Book
  warnings: string[]
}

interface BookImageAsset {
  filename: string
  url: string
}

useSeoMeta({
  title: 'Editor de livros | Dasha Cave',
  robots: 'noindex, nofollow',
})

function emptyBook(): Book {
  return {
    slug: '',
    title: '',
    subtitle: '',
    amazonUrl: '',
    image: '',
    imageAlt: '',
    themes: [],
    synopsis: [],
    ageRating: '',
    details: [],
    accent: '#1a8173',
  }
}

const books = ref<Book[]>([])
const draft = ref<Book>(emptyBook())
const originalSlug = ref('')
const amazonUrlToImport = ref('')
const imageAssets = ref<BookImageAsset[]>([])
const imageBucketOpen = ref(false)
const bucketLoading = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const notice = ref('')

const isNewBook = computed(() => !originalSlug.value)
const themesText = computed({
  get: () => draft.value.themes.join('\n'),
  set: (value: string) => {
    draft.value.themes = value.split('\n').map(item => item.trim()).filter(Boolean)
  },
})
const synopsisText = computed({
  get: () => draft.value.synopsis.join('\n\n'),
  set: (value: string) => {
    draft.value.synopsis = value.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean)
  },
})
const detailsText = computed({
  get: () => draft.value.details.join('\n'),
  set: (value: string) => {
    draft.value.details = value.split('\n').map(item => item.trim()).filter(Boolean)
  },
})

function showError(cause: unknown) {
  if (cause && typeof cause === 'object' && 'statusMessage' in cause && typeof cause.statusMessage === 'string') {
    errorMessage.value = cause.statusMessage
  }
  else if (cause instanceof Error) {
    errorMessage.value = cause.message
  }
  else {
    errorMessage.value = 'Não foi possível concluir a operação.'
  }
}

async function loadBooks() {
  books.value = await $fetch<Book[]>('/api/books')
}

onMounted(async () => {
  try {
    await $fetch('/api/auth/me')
    await refreshSession()
    if (loggedIn.value && user.value?.role === 'admin')
      await loadBooks()
  }
  catch (cause) {
    showError(cause)
  }
})

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    books.value = []
    draft.value = emptyBook()
    originalSlug.value = ''
    notice.value = ''
    errorMessage.value = ''
  }
  catch (cause) {
    showError(cause)
  }
}

function startNewBook() {
  draft.value = emptyBook()
  originalSlug.value = ''
  errorMessage.value = ''
  notice.value = ''
}

function editBook(book: Book) {
  draft.value = {
    ...book,
    themes: [...book.themes],
    synopsis: [...book.synopsis],
    details: [...book.details],
  }
  originalSlug.value = book.slug
  errorMessage.value = ''
  notice.value = ''
}

async function importFromAmazon() {
  loading.value = true
  errorMessage.value = ''
  notice.value = ''
  try {
    const result = await $fetch<AmazonBookImportResult>('/api/books/import', {
      method: 'POST',
      body: { amazonUrl: amazonUrlToImport.value },
    })
    const imported = result.book
    const existing = books.value.find(book => book.slug === imported.slug)
    draft.value = imported
    originalSlug.value = existing?.slug ?? ''
    notice.value = [
      'Dados importados. Revise os campos e salve para publicar.',
      ...result.warnings,
    ].join(' ')
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    loading.value = false
  }
}

async function uploadImage(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.files?.[0])
    return

  const formData = new FormData()
  formData.append('image', input.files[0])
  loading.value = true
  errorMessage.value = ''
  notice.value = ''
  try {
    const result = await $fetch<{ image: string }>('/api/books/image', {
      method: 'POST',
      body: formData,
    })
    draft.value.image = result.image
    if (!draft.value.imageAlt)
      draft.value.imageAlt = draft.value.title
    notice.value = 'Imagem enviada para o bucket local do site.'
    if (imageBucketOpen.value)
      await loadImageBucket()
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    loading.value = false
    input.value = ''
  }
}

async function loadImageBucket() {
  bucketLoading.value = true
  try {
    imageAssets.value = await $fetch<BookImageAsset[]>('/api/books/images')
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    bucketLoading.value = false
  }
}

function toggleImageBucket() {
  imageBucketOpen.value = !imageBucketOpen.value
  if (imageBucketOpen.value)
    void loadImageBucket()
}

function selectBookImage(image: BookImageAsset) {
  draft.value.image = image.url
  if (!draft.value.imageAlt)
    draft.value.imageAlt = draft.value.title
  imageBucketOpen.value = false
  notice.value = 'Imagem selecionada do bucket.'
}

async function saveBook() {
  loading.value = true
  errorMessage.value = ''
  notice.value = ''
  try {
    const saved = await $fetch<Book>(
      isNewBook.value ? '/api/books' : `/api/books/${encodeURIComponent(originalSlug.value)}`,
      {
        method: isNewBook.value ? 'POST' : 'PUT',
        body: draft.value,
      },
    )
    draft.value = saved
    originalSlug.value = saved.slug
    await loadBooks()
    notice.value = 'Livro salvo.'
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    loading.value = false
  }
}

async function deleteBook() {
  if (!originalSlug.value || !window.confirm(`Excluir “${draft.value.title}”?`))
    return

  loading.value = true
  errorMessage.value = ''
  notice.value = ''
  try {
    await $fetch(`/api/books/${encodeURIComponent(originalSlug.value)}`, { method: 'DELETE' })
    await loadBooks()
    startNewBook()
    notice.value = 'Livro excluído.'
  }
  catch (cause) {
    showError(cause)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="book-editor">
    <NuxtLink class="book-editor__back" to="/">← Voltar ao site</NuxtLink>

    <section v-if="!loggedIn" class="book-editor__login">
      <p class="book-editor__eyebrow">Área de edição</p>
      <h1>Editor de livros</h1>
      <p>Entre com a mesma conta que você usa no blog para gerenciar os livros.</p>
      <NuxtLink
        class="book-editor__login-action"
        :to="{ path: '/login', query: { redirect: '/livros/admin' } }"
      >
        Entrar ou criar conta
      </NuxtLink>
      <p v-if="errorMessage" class="book-editor__message book-editor__message--error" role="alert">
        {{ errorMessage }}
      </p>
    </section>

    <section v-else-if="user?.role !== 'admin'" class="book-editor__login">
      <p class="book-editor__eyebrow">Perfil de comentador</p>
      <h1>Editor de livros</h1>
      <p>Sua conta pode ler o blog. Somente administradores podem editar livros ou publicar posts.</p>
      <button class="book-editor__login-action" type="button" @click="logout">
        Sair
      </button>
    </section>

    <template v-else>
      <header class="book-editor__header">
        <div>
          <p class="book-editor__eyebrow">Área de edição</p>
          <h1>Editor de livros</h1>
          <p>Conectado como {{ user?.name }}. Edite livros ou importe um produto da Amazon.</p>
        </div>
        <button class="book-editor__logout" type="button" @click="logout">Sair</button>
      </header>

      <p v-if="errorMessage" class="book-editor__message book-editor__message--error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="notice" class="book-editor__message book-editor__message--notice" role="status">
        {{ notice }}
      </p>

      <section class="book-editor__import" aria-labelledby="amazon-import-title">
        <h2 id="amazon-import-title">Importar da Amazon</h2>
        <form class="book-editor__import-form" @submit.prevent="importFromAmazon">
          <label for="amazon-url">Link do livro na Amazon Brasil</label>
          <div class="book-editor__inline-form">
            <input
              id="amazon-url"
              v-model="amazonUrlToImport"
              type="url"
              placeholder="https://www.amazon.com.br/dp/..."
              required
            >
            <button type="submit" :disabled="loading">
              {{ loading ? 'Importando…' : 'Buscar dados e capa' }}
            </button>
          </div>
          <p>Os dados carregados ficam como rascunho até você revisar e salvar.</p>
        </form>
      </section>

      <div class="book-editor__workspace">
        <nav class="book-editor__list" aria-label="Livros cadastrados">
          <div class="book-editor__list-heading">
            <h2>Livros</h2>
            <button type="button" @click="startNewBook">+ Novo</button>
          </div>
          <button
            v-for="book in books"
            :key="book.slug"
            class="book-editor__book-option"
            :class="{ 'book-editor__book-option--active': book.slug === originalSlug }"
            type="button"
            @click="editBook(book)"
          >
            <img v-if="book.image" :src="book.image" :alt="book.imageAlt" loading="lazy">
            <span>{{ book.title }}</span>
          </button>
        </nav>

        <form class="book-editor__form" @submit.prevent="saveBook">
          <h2>{{ isNewBook ? 'Novo livro' : `Editar: ${draft.title}` }}</h2>

          <div class="book-editor__field-grid">
            <label>
              Título
              <input v-model="draft.title" maxlength="180" required>
            </label>
            <label>
              Slug (endereço)
              <input v-model="draft.slug" maxlength="80" placeholder="Gerado automaticamente pelo título">
            </label>
          </div>

          <label>
            Subtítulo
            <input v-model="draft.subtitle" maxlength="240">
          </label>

          <label>
            Link da Amazon Brasil
            <input v-model="draft.amazonUrl" type="url" maxlength="2048" required>
          </label>

          <div class="book-editor__field-grid">
            <label>
              Caminho da imagem
              <input v-model="draft.image" placeholder="/api/books/images/nome-do-arquivo.jpg">
            </label>
            <label>
              Texto alternativo da imagem
              <input v-model="draft.imageAlt" maxlength="240">
            </label>
          </div>

          <label>
            Enviar uma imagem (JPEG, PNG ou WebP, até 5 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="uploadImage">
          </label>

          <button
            class="book-editor__bucket-toggle"
            type="button"
            :aria-expanded="imageBucketOpen"
            aria-controls="book-image-bucket"
            :disabled="bucketLoading"
            @click="toggleImageBucket"
          >
            {{ imageBucketOpen ? 'Fechar bucket de imagens' : 'Escolher imagem do bucket' }}
          </button>

          <section
            v-if="imageBucketOpen"
            id="book-image-bucket"
            class="book-editor__image-bucket"
            aria-label="Bucket de imagens"
          >
            <p v-if="bucketLoading" role="status">Carregando imagens…</p>
            <p v-else-if="!imageAssets.length">Ainda não há imagens. Envie uma imagem para começar.</p>
            <div v-else class="book-editor__image-grid">
              <button
                v-for="image in imageAssets"
                :key="image.filename"
                class="book-editor__image-option"
                :class="{ 'book-editor__image-option--active': draft.image === image.url }"
                type="button"
                :aria-label="`Selecionar ${image.filename}`"
                @click="selectBookImage(image)"
              >
                <img :src="image.url" :alt="image.filename" loading="lazy">
                <span>{{ image.filename }}</span>
              </button>
            </div>
          </section>

          <label>
            Temas (um por linha)
            <textarea v-model="themesText" rows="4" />
          </label>

          <label>
            Sinopse (separe os parágrafos com uma linha em branco)
            <textarea v-model="synopsisText" rows="8" />
          </label>

          <div class="book-editor__field-grid">
            <label>
              Aviso etário e de conteúdo
              <input v-model="draft.ageRating" maxlength="240">
            </label>
            <label>
              Cor de destaque
              <input v-model="draft.accent" type="color">
            </label>
          </div>

          <label>
            Detalhes (um por linha)
            <textarea v-model="detailsText" rows="4" />
          </label>

          <div class="book-editor__actions">
            <button type="submit" :disabled="loading">
              {{ loading ? 'Salvando…' : 'Salvar livro' }}
            </button>
            <button
              v-if="!isNewBook"
              class="book-editor__delete"
              type="button"
              :disabled="loading"
              @click="deleteBook"
            >
              Excluir
            </button>
          </div>
        </form>
      </div>
    </template>
  </main>
</template>

<style scoped>
.book-editor {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 2rem 1rem 4rem;
  color: #fff;
}

.book-editor__back {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  margin-bottom: 1.5rem;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.book-editor__back:hover {
  color: #00ffaa;
}

.book-editor__login,
.book-editor__import,
.book-editor__list,
.book-editor__form {
  border: 1px solid rgb(112 230 218 / 30%);
  border-radius: 1rem;
  background: rgb(9 18 16 / 72%);
  box-shadow: 0 12px 32px rgb(0 0 0 / 30%);
}

.book-editor__login {
  width: min(100%, 440px);
  margin: 4vh auto 0;
  padding: 2rem;
}

.book-editor__login h1,
.book-editor__header h1 {
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.4rem);
}

.book-editor__login > p:not(.book-editor__eyebrow, .book-editor__message) {
  color: rgb(255 255 255 / 75%);
  line-height: 1.55;
}

.book-editor__eyebrow {
  margin: 0 0 0.4rem;
  color: #00ffaa;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.book-editor__form {
  display: grid;
  gap: 1rem;
}

.book-editor__bucket-toggle {
  justify-self: start;
}

.book-editor__image-bucket {
  display: grid;
  padding: 1rem;
  border: 1px solid rgb(112 230 218 / 25%);
  border-radius: 0.75rem;
  background: rgb(0 0 0 / 20%);
  gap: 0.75rem;
}

.book-editor__image-bucket > p {
  margin: 0;
  color: rgb(255 255 255 / 75%);
}

.book-editor__image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.75rem;
}

.book-editor .book-editor__image-option {
  display: grid;
  min-width: 0;
  height: auto;
  padding: 0.5rem;
  gap: 0.45rem;
  color: #fff;
  text-align: left;
}

.book-editor__image-option img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 0.35rem;
  object-fit: cover;
}

.book-editor__image-option span {
  overflow-wrap: anywhere;
  font-size: 0.7rem;
}

.book-editor .book-editor__image-option--active,
.book-editor .book-editor__image-option:hover {
  border-color: #00ffaa;
  background: rgb(0 255 170 / 12%);
}

.book-editor__login-action {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  border: 1px solid rgb(112 230 218 / 50%);
  border-radius: 0.6rem;
  background: linear-gradient(135deg, #005d50 0%, #00626f 100%);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.book-editor__login-action:hover,
.book-editor__login-action:focus-visible {
  border-color: #00ffaa;
  color: #00ffaa;
}

.book-editor__header {
  display: flex;
  max-width: 1200px;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto 1.5rem;
  gap: 1rem;
}

.book-editor__header p:not(.book-editor__eyebrow) {
  margin-bottom: 0;
  color: rgb(255 255 255 / 75%);
}

.book-editor__logout {
  background: transparent !important;
}

.book-editor__import,
.book-editor__workspace,
.book-editor__message {
  width: min(100%, 1200px);
  margin: 0 auto 1rem;
}

.book-editor__import {
  padding: 1.25rem;
}

.book-editor__import h2,
.book-editor__list h2,
.book-editor__form h2 {
  margin: 0;
  font-size: 1.2rem;
}

.book-editor__import-form,
.book-editor__import-form label,
.book-editor__field-grid,
.book-editor__form label {
  display: grid;
  gap: 0.5rem;
}

.book-editor__import-form p {
  margin: 0.25rem 0 0;
  color: rgb(255 255 255 / 65%);
  font-size: 0.85rem;
}

.book-editor__inline-form {
  display: flex;
  gap: 0.65rem;
}

.book-editor__workspace {
  display: grid;
  grid-template-columns: minmax(210px, 0.65fr) minmax(0, 1.6fr);
  align-items: start;
  gap: 1rem;
}

.book-editor__list {
  position: sticky;
  top: 1rem;
  display: grid;
  max-height: calc(100vh - 2rem);
  overflow: auto;
  padding: 1rem;
  gap: 0.5rem;
}

.book-editor__list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.book-editor__book-option {
  display: flex;
  min-width: 0;
  align-items: center;
  padding: 0.5rem;
  gap: 0.65rem;
  border: 1px solid transparent;
  border-radius: 0.65rem;
  background: rgb(255 255 255 / 5%);
  color: #fff;
  cursor: pointer;
  text-align: left;
}

.book-editor__book-option--active,
.book-editor__book-option:hover {
  border-color: #00ffaa;
  background: rgb(0 255 170 / 10%);
}

.book-editor__book-option img {
  width: 2.5rem;
  height: 3.5rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.book-editor__form {
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.5rem);
}

.book-editor__field-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.book-editor input:not([type="file"]):not([type="color"]),
.book-editor textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 0.55rem;
  background: rgb(0 0 0 / 30%);
  color: #fff;
  font: inherit;
}

.book-editor input[type="file"] {
  width: 100%;
  padding: 0.55rem 0;
  color: rgb(255 255 255 / 80%);
}

.book-editor input[type="color"] {
  width: 4rem;
  height: 2.6rem;
  padding: 0.2rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 0.45rem;
  background: transparent;
}

.book-editor textarea {
  resize: vertical;
  line-height: 1.5;
}

.book-editor button {
  min-height: 42px;
  padding: 0.65rem 1rem;
  border: 1px solid rgb(112 230 218 / 45%);
  border-radius: 0.65rem;
  background: linear-gradient(135deg, #0f382a, #1b2622);
  color: #00ffaa;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.book-editor button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.book-editor button:focus-visible,
.book-editor input:focus-visible,
.book-editor textarea:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

.book-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.book-editor .book-editor__delete {
  border-color: rgb(255 105 105 / 55%);
  background: rgb(110 20 24 / 50%);
  color: #ffb6b6;
}

.book-editor__message {
  padding: 0.8rem 1rem;
  border-radius: 0.6rem;
}

.book-editor__message--error {
  border: 1px solid rgb(255 110 110 / 45%);
  background: rgb(110 20 24 / 55%);
  color: #ffd1d1;
}

.book-editor__message--notice {
  border: 1px solid rgb(0 255 170 / 35%);
  background: rgb(0 70 48 / 55%);
  color: #b7ffe6;
}

@media (max-width: 760px) {
  .book-editor__workspace {
    grid-template-columns: 1fr;
  }

  .book-editor__list {
    position: static;
    max-height: none;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .book-editor__list-heading {
    grid-column: 1 / -1;
  }
}

@media (max-width: 520px) {
  .book-editor__header,
  .book-editor__inline-form {
    align-items: stretch;
    flex-direction: column;
  }

  .book-editor__field-grid {
    grid-template-columns: 1fr;
  }

  .book-editor__list {
    grid-template-columns: 1fr;
  }
}
</style>
