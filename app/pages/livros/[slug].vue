<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '#shared/types/book'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { data: book, error } = await useFetch<Book>(
  () => `/api/books/${encodeURIComponent(slug.value)}`,
  { key: () => `book-${slug.value}` },
)

if (error.value && error.value.statusCode !== 404)
  throw error.value

if (import.meta.server && (error.value || !book.value))
  setResponseStatus(404)

useSeoMeta({
  title: () => book.value ? `${book.value.title} | Dasha Cave` : 'Livro não encontrado | Dasha Cave',
  description: () => book.value?.synopsis.join(' ').slice(0, 160) || 'Conheça os livros de Dasha Cave.',
  ogType: 'book',
})

function handlePageClick(event: MouseEvent) {
  if (
    event.target === event.currentTarget
    && window.matchMedia('(min-width: 761px)').matches
  ) {
    navigateTo('/')
  }
}
</script>

<template>
  <main
    v-if="book"
    class="book-page"
    :style="{ '--book-accent': book.accent }"
    @click="handlePageClick"
  >
    <NuxtLink class="book-page__back" to="/">
      ← Voltar para a página inicial
    </NuxtLink>

    <article class="book-page__card">
      <div class="book-page__art">
        <img
          v-if="book.image?.startsWith('/api/books/images/')"
          class="book-page__art-image"
          :src="book.image"
          :alt="book.imageAlt"
          width="400"
          height="540"
        >
        <NuxtImg
          v-else-if="book.image"
          class="book-page__art-image"
          :src="book.image"
          :alt="book.imageAlt"
          :placeholder="[400, 540]"
          width="400"
          height="540"
        />
        <div v-else class="book-page__image-placeholder">
          Capa a adicionar
        </div>
      </div>

      <section class="book-page__content" aria-labelledby="book-title">
        <p class="book-page__eyebrow">Livro de Dasha Cave</p>
        <h1 id="book-title" class="book-page__title">{{ book.title }}</h1>
        <p v-if="book.subtitle" class="book-page__subtitle">{{ book.subtitle }}</p>

        <ul class="book-page__themes" aria-label="Temas do livro">
          <li v-for="theme in book.themes" :key="theme">{{ theme }}</li>
        </ul>

        <ul class="book-page__details" aria-label="Detalhes do livro">
          <li v-for="detail in book.details" :key="detail">{{ detail }}</li>
        </ul>

        <div class="book-page__synopsis">
          <p v-for="paragraph in book.synopsis" :key="paragraph">{{ paragraph }}</p>
        </div>

        <p v-if="book.ageRating" class="book-page__age-rating">{{ book.ageRating }}</p>

        <NuxtLink class="book-page__amazon" :to="book.amazonUrl" target="_blank" rel="noopener noreferrer">
          Ver na Amazon
        </NuxtLink>
      </section>
    </article>
  </main>

  <main v-else class="book-page book-page--missing">
    <h1>Livro não encontrado</h1>
    <NuxtLink class="book-page__back" to="/">Voltar para a página inicial</NuxtLink>
  </main>
</template>

<style scoped>
.book-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 2rem 1rem 4rem;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--book-accent) 40%, transparent), transparent 28rem),
    linear-gradient(165deg, #111417 0%, #060809 100%);
}

.book-page__back {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  margin: 0 auto 1.25rem;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

.book-page__back:hover {
  color: #00ffaa;
  text-decoration: underline;
  text-underline-offset: 0.25rem;
}

.book-page__card {
  display: grid;
  width: min(100%, 980px);
  margin: 0 auto;
  grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--book-accent) 65%, #fff);
  border-radius: 1.5rem;
  background: rgb(10 11 12 / 88%);
  box-shadow: 0 20px 60px rgb(0 0 0 / 45%);
}

.book-page__art {
  position: relative;
  display: grid;
  min-height: 600px;
  place-items: center;
  padding: 2rem;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 10%), rgb(0 0 0 / 65%)),
    linear-gradient(145deg, color-mix(in srgb, var(--book-accent) 75%, #080808), #090909);
}

.book-page__art-image {
  display: block;
  width: 100%;
  max-width: 390px;
  height: auto;
  max-height: 530px;
  border-radius: 1rem;
  box-shadow: 0 18px 40px rgb(0 0 0 / 60%);
  object-fit: contain;
}

.book-page__image-placeholder {
  display: grid;
  width: min(100%, 390px);
  min-height: 20rem;
  place-items: center;
  border: 1px dashed rgb(255 255 255 / 55%);
  border-radius: 1rem;
  color: rgb(255 255 255 / 75%);
  font-weight: 700;
}

.book-page__content {
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3.25rem);
}

.book-page__eyebrow {
  margin: 0 0 0.5rem;
  color: #00ffaa;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.book-page__title {
  margin: 0;
  font-family: Arial, sans-serif;
  font-size: clamp(2.2rem, 7vw, 4.5rem);
  line-height: 0.95;
  text-wrap: balance;
}

.book-page__subtitle {
  margin: 0.75rem 0 0;
  color: #f3b9cb;
  font-weight: 700;
}

.book-page__themes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 1.25rem 0;
  padding: 0;
  list-style: none;
}

.book-page__themes li {
  padding: 0.38rem 0.68rem;
  border: 1px solid color-mix(in srgb, var(--book-accent) 75%, #fff);
  border-radius: 999px;
  background: color-mix(in srgb, var(--book-accent) 28%, transparent);
  font-size: 0.78rem;
  font-weight: 700;
}

.book-page__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
}

.book-page__details li {
  padding: 0.55rem 0.7rem;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 4%);
  color: rgb(255 255 255 / 78%);
  font-size: 0.82rem;
}

.book-page__synopsis {
  color: rgb(255 255 255 / 88%);
  font-size: 1rem;
  line-height: 1.72;
}

.book-page__synopsis p {
  margin: 0 0 1rem;
}

.book-page__age-rating {
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--book-accent);
  background: color-mix(in srgb, var(--book-accent) 20%, transparent);
  font-weight: 800;
}

.book-page__amazon {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border: 1px solid #fff;
  border-radius: 999px;
  background: var(--book-accent);
  color: #fff;
  font-weight: 800;
  text-decoration: none;
}

.book-page__amazon:hover {
  filter: brightness(1.25);
  transform: translateY(-2px);
}

.book-page__back:focus-visible,
.book-page__amazon:focus-visible {
  border-radius: 999px;
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.book-page--missing {
  text-align: center;
}

@media (max-width: 760px) {
  .book-page {
    padding-bottom: 6.5rem;
  }

  .book-page__back {
    position: fixed;
    z-index: 20;
    right: max(1rem, env(safe-area-inset-right));
    bottom: max(1rem, env(safe-area-inset-bottom));
    max-width: calc(100vw - 2rem);
    min-height: 48px;
    margin: 0;
    padding: 0.75rem 1rem;
    border: 1px solid rgb(255 255 255 / 35%);
    border-radius: 999px;
    background: rgb(10 11 12 / 96%);
    box-shadow: 0 8px 24px rgb(0 0 0 / 45%);
  }

  .book-page__card {
    grid-template-columns: 1fr;
  }

  .book-page__art {
    min-height: 320px;
  }

  .book-page__art-image {
    max-height: 300px;
  }
}
</style>
