<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'

const amazonUrl = 'https://www.amazon.com.br/dp/B0HRP7B81F'
const launchImages = [
  '/imagens/eu-fui-uma-boa-garota/902586371_18190075666413559_7817302063939449659_n.webp',
  '/imagens/eu-fui-uma-boa-garota/902586310_18190075693413559_5287847086883491344_n.webp',
  '/imagens/eu-fui-uma-boa-garota/902586461_18190075678413559_180433619291318656_n.webp',
] as const
const synopsis = [
  'Ops... Sora e Mia estão oficialmente encrencadas neste Natal.',
  'Depois de serem expulsas de Faer, elas recebem uma missão no mundo humano: ajudar Hammer — um idoso em luto — a manter aberta uma confeitaria que construiu com a esposa e entregar as encomendas natalinas mais aguardadas da cidade de Crystal.',
  'Como se isso não fosse complicado o bastante, elas devem esconder suas verdadeiras aparências e finalmente enfrentar sentimentos que não conseguem mais manter em segredo.',
].join(' ')

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const activeSlide = shallowRef(0)
const preorderBadgePosition = shallowRef<{ x: number, y: number } | null>(null)
const activeImageAlt = computed(() =>
  activeSlide.value === 0
    ? `Sinopse de Eu Fui uma Boa Garota?: ${synopsis}`
    : `Eu Fui uma Boa Garota? - imagem ${activeSlide.value + 1}`,
)

function openDialog() {
  activeSlide.value = 0
  preorderBadgePosition.value = null
  dialog.value?.showModal()
}

function closeDialog() {
  dialog.value?.close()
}

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) {
    closeDialog()
  }
}

function showPreviousSlide() {
  activeSlide.value = (activeSlide.value - 1 + launchImages.length) % launchImages.length
}

function showNextSlide() {
  activeSlide.value = (activeSlide.value + 1) % launchImages.length
}

function selectSlide(index: number) {
  activeSlide.value = index
}

function handleCarouselKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    showPreviousSlide()
  }
  if (event.key === 'ArrowRight') {
    showNextSlide()
  }
  if (event.key === 'Escape') {
    closeDialog()
  }
}

function movePreorderBadge(event: PointerEvent) {
  if (event.pointerType !== 'mouse') {
    return
  }

  preorderBadgePosition.value = {
    x: Math.min(event.clientX + 16, window.innerWidth - 132),
    y: Math.min(event.clientY + 16, window.innerHeight - 52),
  }
}
</script>

<template>
  <button
    type="button"
    class="featured-book__trigger"
    aria-label="Conheça Eu Fui uma Boa Garota? na Amazon"
    @click="openDialog"
  >
    <NuxtImg
      class="featured-book__cover"
      src="/imagens/eu-fui-uma-boa-garota/banner.webp"
      alt="Capa de &quot;Eu Fui uma Boa Garota?&quot;"
      width="300"
      height="404"
    />
    <NuxtImg
      class="featured-book__launch-date"
      src="/imagens/eu-fui-uma-boa-garota/data-lancamento.webp"
      alt="15/12 disponível na Amazon"
      width="1148"
      height="751"
    />
  </button>

  <dialog
    ref="dialog"
    class="featured-book__dialog"
    aria-label="Eu Fui uma Boa Garota?"
    @click="closeOnBackdrop"
    @keydown="handleCarouselKeydown"
    @pointermove="movePreorderBadge"
  >
    <span
      v-if="preorderBadgePosition"
      class="featured-book__preorder-badge"
      aria-hidden="true"
      :style="{
        left: `${preorderBadgePosition.x}px`,
        top: `${preorderBadgePosition.y}px`,
      }"
    >
      Pré-venda
    </span>
    <div class="featured-book__dialog-panel">
      <button
        type="button"
        class="featured-book__dialog-close"
        aria-label="Fechar"
        @click="closeDialog"
      >
        ×
      </button>
      <div
        class="featured-book__carousel"
        role="region"
        aria-roledescription="carrossel"
        aria-label="Fotos de Eu Fui uma Boa Garota?"
        aria-live="polite"
      >
        <NuxtLink
          class="featured-book__carousel-link"
          :to="amazonUrl"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Abrir Eu Fui uma Boa Garota? na Amazon, imagem ${activeSlide + 1}`"
        >
          <NuxtImg
            :key="launchImages[activeSlide]"
            class="featured-book__carousel-image"
            :src="launchImages[activeSlide]"
            :alt="activeImageAlt"
            width="1440"
            height="1800"
          />
        </NuxtLink>

        <button
          type="button"
          class="featured-book__carousel-arrow featured-book__carousel-arrow--previous"
          aria-label="Imagem anterior"
          @click="showPreviousSlide"
        >
          ‹
        </button>
        <button
          type="button"
          class="featured-book__carousel-arrow featured-book__carousel-arrow--next"
          aria-label="Próxima imagem"
          @click="showNextSlide"
        >
          ›
        </button>

        <div class="featured-book__carousel-dots" aria-label="Escolher imagem">
          <button
            v-for="(image, index) in launchImages"
            :key="image"
            type="button"
            class="featured-book__carousel-dot"
            :class="{ 'featured-book__carousel-dot--active': index === activeSlide }"
            :aria-label="`Mostrar imagem ${index + 1}`"
            :aria-current="index === activeSlide ? 'true' : undefined"
            @click="selectSlide(index)"
          />
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.featured-book__trigger {
  box-sizing: border-box;
  display: block;
  width: min(100%, 320px);
  margin: 1.5rem auto 0.5rem;
  padding: 0.5rem;
  overflow: hidden;
  border: 1px solid rgb(196 59 72 / 75%);
  border-radius: 25px;
  background: linear-gradient(145deg, #4a0710 0%, #150406 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 35%);
  color: inherit;
  cursor: pointer;
  font: inherit;
  appearance: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.featured-book__trigger:hover {
  transform: translateY(-2px);
  border-color: rgb(244 112 124 / 95%);
  background: linear-gradient(145deg, #750f1c 0%, #240508 100%);
  box-shadow: 0 0 18px rgb(196 38 55 / 55%);
}

.featured-book__trigger:focus-visible,
.featured-book__dialog-close:focus-visible,
.featured-book__carousel-arrow:focus-visible,
.featured-book__carousel-dot:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.featured-book__cover,
.featured-book__launch-date {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 18px;
}

.featured-book__cover {
  aspect-ratio: 785 / 1057;
  object-fit: cover;
}

.featured-book__launch-date {
  margin-top: 0.5rem;
  aspect-ratio: 1148 / 751;
}

.featured-book__dialog {
  box-sizing: border-box;
  width: 100vw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: #170406;
  color: #fff;
  box-shadow: none;
}

.featured-book__dialog::backdrop {
  background: rgb(6 3 4 / 82%);
  backdrop-filter: blur(6px);
}

.featured-book__dialog-panel {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 3.75rem 5rem 1.25rem;
}

.featured-book__dialog-close {
  position: absolute;
  z-index: 3;
  top: 0.65rem;
  right: 0.65rem;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgb(244 112 124 / 70%);
  border-radius: 50%;
  background: #4a0710;
  color: #fff;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}

.featured-book__preorder-badge {
  position: fixed;
  z-index: 4;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgb(255 215 160 / 85%);
  border-radius: 999px;
  background: #4a0710;
  box-shadow: 0 4px 16px rgb(0 0 0 / 45%);
  color: #fff3df;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  pointer-events: none;
  white-space: nowrap;
}

.featured-book__carousel {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
}

.featured-book__carousel-link {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #080203;
}

.featured-book__carousel-link:focus-visible {
  outline: 3px solid #fff;
  outline-offset: -6px;
}

.featured-book__carousel-image {
  display: block;
  width: auto;
  height: auto;
  max-width: calc(100vw - 2rem);
  max-height: calc(100dvh - 7rem);
  object-fit: contain;
}

.featured-book__carousel-arrow {
  position: absolute;
  top: 50%;
  width: 3.25rem;
  height: 3.25rem;
  border: 1px solid rgb(244 112 124 / 75%);
  border-radius: 50%;
  background: rgb(23 4 6 / 88%);
  color: #fff;
  cursor: pointer;
  font-size: 2.25rem;
  line-height: 1;
  transform: translateY(-50%);
}

.featured-book__carousel-arrow--previous {
  left: 1.25rem;
}

.featured-book__carousel-arrow--next {
  right: 1.25rem;
}

.featured-book__carousel-dots {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  display: flex;
  gap: 0.65rem;
  padding: 0.55rem 0.7rem;
  border-radius: 999px;
  background: rgb(23 4 6 / 88%);
  transform: translateX(-50%);
}

.featured-book__carousel-dot {
  width: 0.75rem;
  height: 0.75rem;
  padding: 0;
  border: 1px solid #fff;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.featured-book__carousel-dot--active {
  background: #ef707c;
}

@media (prefers-reduced-motion: reduce) {
  .featured-book__trigger {
    transition: none;
  }
}

@media (max-width: 560px) {
  .featured-book__dialog-panel {
    padding: 3.5rem 0.5rem 1rem;
  }

  .featured-book__carousel-arrow {
    width: 2.75rem;
    height: 2.75rem;
  }

  .featured-book__carousel-arrow--previous {
    left: 0.5rem;
  }

  .featured-book__carousel-arrow--next {
    right: 0.5rem;
  }
}
</style>
