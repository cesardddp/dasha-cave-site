<script setup lang="ts">
import type { Book } from '#shared/types/book'

defineProps<{ books: Book[] }>()

const imageCardClasses: Record<string, string> = {
  'eu-fui-uma-boa-garota': 'home-page__image-link--eu-fui',
  'trick-me': 'home-page__image-link--trick-me',
  'la-calamita': 'home-page__image-la-calamita',
  afrodite: 'home-page__image-afrodite-ri',
  'o-parque-dos-pecados': 'home-page__image-parque',
}

function imageCardClass(slug: string) {
  return imageCardClasses[slug] ?? ''
}

function bookAriaLabel(book: Book) {
  return book.slug === 'eu-fui-uma-boa-garota'
    ? 'Conheça Eu Fui uma Boa Garota?, em pré-venda e lançamento'
    : `Conheça ${book.title}`
}
</script>

<template>
  <div class="home-book-list">
    <section class="home-page__books home-page__books--mobile" aria-label="Livros">
      <NuxtLink
        class="home-page__image-link home-page__image-link--eu-fui"
        to="/livros/eu-fui-uma-boa-garota"
        aria-label="Conheça Eu Fui uma Boa Garota?, em pré-venda e lançamento"
      >
        <NuxtImg src="/imagens/eu-fui-uma-boa-garota/banner.webp" alt="Capa de Eu Fui uma Boa Garota?" :placeholder="[300, 404]" width="300" height="404" />
        <span class="home-page__launch-badge" aria-hidden="true">
          <span>Pré-venda</span>
          <span>Lançamento</span>
        </span>
      </NuxtLink>
      <NuxtLink
        class="home-page__image-link home-page__image-link--trick-me"
        to="/livros/trick-me"
        aria-label="Conheça Trick Me: Spin-off de Ange"
      >
        <NuxtImg src="/imagens/titulo_capa_trick_me.webp" alt="Trick Me: Um Spin-off de Ange" :placeholder="[300, 169]" width="300" height="169" />
      </NuxtLink>
      <NuxtLink
        class="home-page__image-link home-page__image-la-calamita"
        to="/livros/la-calamita"
        aria-label="Conheça La Calamità"
      >
        <NuxtImg src="/imagens/titulo_capa_la_calamita.webp" alt="La Calamità" :placeholder="[300, 178]" width="300" height="178" />
        <span class="home-page__blood" aria-hidden="true">
          <span v-for="drop in 10" :key="drop" class="home-page__blood-drop" />
        </span>
      </NuxtLink>
      <NuxtLink
        class="home-page__image-link home-page__image-afrodite-ri"
        to="/livros/afrodite"
        aria-label="Conheça Afrodite Ri"
      >
        <NuxtImg src="/imagens/titulo_capa_afrodite.webp" alt="Afrodite Ri" :placeholder="[300, 86]" width="300" height="86" />
      </NuxtLink>
      <NuxtLink
        class="home-page__image-link home-page__image-parque"
        to="/livros/o-parque-dos-pecados"
        aria-label="Conheça O Parque dos Pecados"
      >
        <NuxtImg src="/imagens/titulo_parque_dos_pecados.webp" alt="O Parque dos Pecados" width="1451" height="749" />
      </NuxtLink>
    </section>

    <section class="home-page__books home-page__books--desktop" aria-label="Livros">
      <NuxtLink
        v-for="book in books"
        :key="book.slug"
        class="home-page__image-link"
        :class="imageCardClass(book.slug)"
        :to="`/livros/${book.slug}`"
        :aria-label="bookAriaLabel(book)"
      >
        <img
          v-if="book.image?.startsWith('/api/books/images/')"
          class="home-page__book-cover"
          :src="book.image"
          :alt="book.imageAlt || `Capa de ${book.title}`"
          width="300"
          height="430"
          loading="lazy"
        >
        <NuxtImg
          v-else-if="book.image"
          class="home-page__book-cover"
          :src="book.image"
          :alt="book.imageAlt || `Capa de ${book.title}`"
          width="300"
          height="430"
          loading="lazy"
        />
        <span v-else class="home-page__book-cover-placeholder">Capa a adicionar</span>
        <span
          v-if="book.slug === 'eu-fui-uma-boa-garota'"
          class="home-page__launch-badge"
          aria-hidden="true"
        >
          <span>Pré-venda</span>
          <span>Lançamento</span>
        </span>
        <span v-if="book.slug === 'la-calamita'" class="home-page__blood" aria-hidden="true">
          <span v-for="drop in 10" :key="drop" class="home-page__blood-drop" />
        </span>
      </NuxtLink>
    </section>

    <NuxtLink class="home-page__admin-link" to="/livros/admin">
      Área de edição de livros
    </NuxtLink>
  </div>
</template>

<style scoped>
.home-book-list {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
}

.home-page__image-link {
  box-sizing: border-box;
  display: block;
  width: min(100%, 320px);
  margin: 0.5rem auto;
  border: 1px solid rgb(112 230 218 / 45%);
  border-radius: 25px;
  box-shadow: 0 4px 15px rgb(0 0 0 / 35%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.home-page__image-link {
  position: relative;
  overflow: hidden;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #005d50 0%, #00626f 100%);
}

.home-page__books {
  display: flex;
  width: min(100%, 320px);
  flex-direction: column;
}

.home-page__books--desktop {
  display: none;
}

.home-page__book-cover {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  max-height: 430px;
  aspect-ratio: 300 / 430;
  object-fit: contain;
}

.home-page__book-cover-placeholder {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 12rem;
  place-items: center;
  border: 1px dashed rgb(255 255 255 / 55%);
  border-radius: 0.75rem;
  color: rgb(255 255 255 / 75%);
  font-size: 0.8rem;
}

.home-page__launch-badge {
  position: absolute;
  z-index: 2;
  top: 0.8rem;
  left: 0.8rem;
  display: grid;
  gap: 0.08rem;
  min-width: 6.7rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid #ffe6da;
  border-radius: 0.25rem 0.25rem 0.55rem 0.25rem;
  background: linear-gradient(145deg, #a21c50, #61113b);
  box-shadow: 0 3px 12px rgb(22 3 12 / 55%);
  color: #fff4e8;
  font-size: 0.72rem;
  line-height: 1.15;
  text-align: center;
  text-shadow: 0 1px 2px rgb(0 0 0 / 45%);
  transform-origin: center center;
  animation: launch-badge-bounce 0.75s ease-in-out infinite alternate;
}

.home-page__launch-badge span:first-child {
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
}

.home-page__launch-badge span:last-child {
  font-weight: 700;
}

.home-page__image-la-calamita {
  isolation: isolate;
}

.home-page__blood {
  position: absolute;
  z-index: 1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.home-page__blood-drop {
  position: absolute;
  top: -20px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c8102e;
  animation: blood-drip 2.2s cubic-bezier(1, 0, 0.91, 0.19) infinite;
}

.home-page__blood-drop::before {
  position: absolute;
  top: -12px;
  left: 0;
  width: 0;
  height: 0;
  border-right: 4px solid transparent;
  border-bottom: 16px solid #c8102e;
  border-left: 4px solid transparent;
  content: "";
}

.home-page__blood-drop:nth-child(1) { left: 6%; animation-delay: 0s; }
.home-page__blood-drop:nth-child(2) { left: 18%; animation-delay: 0.25s; }
.home-page__blood-drop:nth-child(3) { left: 30%; animation-delay: 0.55s; }
.home-page__blood-drop:nth-child(4) { left: 42%; animation-delay: 0.15s; }
.home-page__blood-drop:nth-child(5) { left: 54%; animation-delay: 0.7s; }
.home-page__blood-drop:nth-child(6) { left: 66%; animation-delay: 0.35s; }
.home-page__blood-drop:nth-child(7) { left: 78%; animation-delay: 0.9s; }
.home-page__blood-drop:nth-child(8) { left: 90%; animation-delay: 0.2s; }
.home-page__blood-drop:nth-child(9) { left: 50%; animation-delay: 0.45s; }
.home-page__blood-drop:nth-child(10) { left: 72%; animation-delay: 0.8s; }

.home-page__image-link img {
  display: block;
  width: 100%;
  height: auto;
}

.home-page__image-la-calamita::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background-image: url("/imagens/titulo_capa_la_calamita_fundo_personagens.webp");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  content: "";
  opacity: 0.65;
  pointer-events: none;
}

.home-page__image-la-calamita img {
  position: relative;
  z-index: 1;
}

.home-page__image-afrodite-ri {
  isolation: isolate;
  border-color: rgb(177 47 57 / 70%);
  background: linear-gradient(135deg, #190306 0%, #5e0b12 55%, #260307 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 55%), 0 0 12px rgb(116 12 22 / 30%);
}

.home-page__image-afrodite-ri::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background-image: url("/imagens/titulo_capa_afrodite_fundo_presonagens.webp");
  background-position: center top;
  background-repeat: no-repeat;
  background-size: cover;
  content: "";
  opacity: 0.65;
  pointer-events: none;
}

.home-page__image-afrodite-ri img {
  position: relative;
  z-index: 1;
}

.home-page__image-parque {
  isolation: isolate;
  border-color: rgb(228 79 158 / 70%);
  background: linear-gradient(135deg, #190619 0%, #57144b 55%, #260a2c 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 55%), 0 0 12px rgb(116 12 95 / 30%);
}

.home-page__image-parque::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background-image: url("/imagens/titulo_parque_dos_pecados_personagens.webp");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  content: "";
  opacity: 0.65;
  pointer-events: none;
}

.home-page__image-parque img {
  position: relative;
  z-index: 1;
}

.home-page__image-link--eu-fui {
  border-color: rgb(196 59 72 / 75%);
  background: linear-gradient(145deg, #4a0710 0%, #150406 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 35%);
}

.home-page__image-link--eu-fui:hover {
  border-color: rgb(244 112 124 / 95%);
  background: linear-gradient(145deg, #750f1c 0%, #240508 100%);
  box-shadow: 0 0 18px rgb(196 38 55 / 55%);
}

.home-page__image-link--trick-me {
  isolation: isolate;
  border-color: rgb(177 47 57 / 70%);
  background: linear-gradient(135deg, #190306 0%, #5e0b12 55%, #260307 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 55%), 0 0 12px rgb(116 12 22 / 30%);
}

.home-page__image-link--trick-me::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background-image: url("/imagens/titulo_capa_trick_me_fundo_trix.webp");
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  content: "";
  opacity: 0.65;
  pointer-events: none;
}

.home-page__image-link--trick-me img {
  position: relative;
  z-index: 1;
}

.home-page__image-link:hover {
  transform: translateY(-2px);
}

.home-page__image-la-calamita:hover {
  border-color: rgb(126 255 238 / 90%);
  background: linear-gradient(135deg, #008f7d 0%, #00a0b5 100%);
  box-shadow: 0 0 15px rgb(0 210 190 / 45%);
}

.home-page__image-afrodite-ri:hover {
  border-color: rgb(239 101 111 / 90%);
  background: linear-gradient(135deg, #3b070d 0%, #8f151f 55%, #4a080f 100%);
  box-shadow: 0 0 18px rgb(177 36 48 / 55%);
}

.home-page__image-parque:hover {
  border-color: rgb(247 151 211 / 90%);
  background: linear-gradient(135deg, #3c0c36 0%, #8b226e 55%, #4a144e 100%);
  box-shadow: 0 0 18px rgb(177 36 148 / 55%);
}

.home-page__image-link--trick-me:hover {
  border-color: rgb(239 101 111 / 90%);
  background: linear-gradient(135deg, #3b070d 0%, #8f151f 55%, #4a080f 100%);
  box-shadow: 0 0 18px rgb(177 36 48 / 55%);
}

.home-page__image-link:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.home-page__admin-link {
  margin-top: 1.5rem;
  color: rgb(255 255 255 / 55%);
  font-size: 0.75rem;
  text-decoration: none;
}

.home-page__admin-link:hover,
.home-page__admin-link:focus-visible {
  color: #00ffaa;
  text-decoration: underline;
}

@keyframes blood-drip {
  0% { top: -20px; opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@keyframes launch-badge-bounce {
  from { transform: rotate(-10deg) translateY(0); }
  to { transform: rotate(-10deg) translateY(-5px); }
}

@media (min-width: 761px) {
  .home-page__books--mobile { display: none; }
  .home-page__books--desktop {
    display: grid;
    width: min(calc(100vw - 2rem), 1100px);
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
  .home-page__books--desktop .home-page__image-link {
    width: 100%;
    margin: 0;
  }
}

@media (min-width: 1100px) {
  .home-page__books--desktop {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-page__image-link,
  .home-page__blood-drop {
    transition: none;
  }
  .home-page__blood-drop {
    animation: none;
  }
  .home-page__launch-badge {
    animation: none;
    transform: rotate(-10deg);
  }
}
</style>
