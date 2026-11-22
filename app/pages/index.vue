<script setup lang="ts">
import type { Book } from '#shared/types/book'

const { data: books, error: booksError } = await useFetch<Book[]>('/api/books', {
  key: 'home-books',
})

if (booksError.value)
  throw booksError.value

useSeoMeta({
  title: 'Dasha Cave | Escritore de mundos sombrios e romances.🗝️',
  description: 'Escritora de ficção sombria e romance, com foco em narrativas que transitam entre o horror e o belo 🏳️‍⚧️🏳️‍🌈',
  ogTitle: 'Dasha Cave',
  ogDescription: 'Ficção sombria e romances queer entre o horror e o belo.',
  ogType: 'website',
})
</script>

<template>
  <main class="home-page">
    <HomeIdentity />
    <HomeProfileLinks />
    <HomeBookList :books="books ?? []" />
  </main>
</template>

<style scoped>
.home-page {
  box-sizing: border-box;
  display: grid;
  min-height: 100vh;
  gap: 1.25rem;
  padding: 2rem 1rem 3rem;
  color: #fff;
  text-align: center;
}
</style>
