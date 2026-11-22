<script setup lang="ts">
import type { Book } from '#shared/types/book'

const { data: books, error: booksError } = await useFetch<Book[]>('/api/books', {
  key: 'home-books',
})

if (booksError.value)
  throw booksError.value

useSeoMeta({
  title: 'Dasha Cave | Ficção sombria, romance queer e suspense🗝️',
  description: 'Conheça Dasha Cave, escritora de ficção sombria e romance queer. Livros com horror, paixão, suspense e amores fora do convencional🏳️‍⚧️🏳️‍🌈.',
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
