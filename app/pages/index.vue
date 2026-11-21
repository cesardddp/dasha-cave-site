<script setup lang="ts">
import { shallowRef } from 'vue'

const bioExpanded = shallowRef(false)

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
    <h1 class="home-page__title">Dasha Cave</h1>

    <div class="home-page__portrait-wrap">
      <NuxtImg
        class="home-page__portrait"
        src="/imagens/dasha_icon.webp"
        alt="Avatar ilustrado de Dasha Cave"
        :placeholder="[300, 300]"
        width="300"
        height="300"
      />
      <span class="home-page__portrait-bubble home-page__portrait-bubble--left-top" aria-hidden="true">🏳️‍🌈</span>
      <span class="home-page__portrait-bubble home-page__portrait-bubble--left-middle" aria-hidden="true">🏳️‍⚧️</span>
      <span class="home-page__portrait-bubble home-page__portrait-bubble--left-bottom" aria-hidden="true">🖤</span>
      <span class="home-page__portrait-bubble home-page__portrait-bubble--right-top" aria-hidden="true">✍️</span>
      <span class="home-page__portrait-bubble home-page__portrait-bubble--right-middle" aria-hidden="true">📚</span>
      <span class="home-page__portrait-bubble home-page__portrait-bubble--right-bottom" aria-hidden="true">🗝️</span>
    </div>

    <section class="home-page__bio" aria-label="Sobre Dasha Cave">
      <p class="home-page__bio-text">
        Escritore de mundos sombrios e romances.<br>
        Entre o horror, o queer e o belo<span v-if="bioExpanded">.</span>
        <template v-if="!bioExpanded">
          ... <button
            class="home-page__bio-toggle home-page__bio-toggle--inline"
            type="button"
            :aria-expanded="bioExpanded"
            aria-controls="dasha-cave-bio-details"
            @click="bioExpanded = true"
          >
            ver mais
          </button>
        </template>
      </p>
      <div
        id="dasha-cave-bio-details"
        class="home-page__bio-details"
        v-show="bioExpanded"
      >
        <p>Capricorniana, parte da comunidade LGBTQIAPN+ e neurodivergente.</p>
        <p>
          Com formação em Filosofia e Nutrição, dedico-me à escrita de amores fora do convencional,
          explorando temas intensos, atmosferas sombrias, suspense e paixão.
        </p>
      </div>
      <button
        v-if="bioExpanded"
        class="home-page__bio-toggle"
        type="button"
        :aria-expanded="bioExpanded"
        aria-controls="dasha-cave-bio-details"
        @click="bioExpanded = false"
      >
        Ver menos
      </button>
    </section>

    <nav class="home-page__navigation" aria-label="Links da Dasha Cave">
      <NuxtLink
        class="home-page__link"
        to="https://www.amazon.com.br/stores/Dasha-Cave/author/B0G86SCW8B?utm_source=dashacave.com.br&utm_medium=link_divulgacao&utm_content=vitrine_autora"
        target="_blank"
      >
        <Icon name="simple-icons:amazon" class="home-page__link-icon" aria-hidden="true" />
        <span>Amazon</span>
      </NuxtLink>
      <NuxtLink
        class="home-page__link"
        to="https://www.instagram.com/autora_dashacave/"
        target="_blank"
      >
        <Icon name="simple-icons:instagram" class="home-page__link-icon" aria-hidden="true" />
        <span>Instagram</span>
      </NuxtLink>
      <NuxtLink
        class="home-page__link"
        to="https://www.tiktok.com/@autora_dashacave"
        target="_blank"
      >
        <Icon name="simple-icons:tiktok" class="home-page__link-icon" aria-hidden="true" />
        <span>TikTok</span>
      </NuxtLink>
      <NuxtLink
        disabled
        class="home-page__link"
        to="https://dashacave.com.br/blog/"
        target="_blank"
      >
        <Icon name="lucide:book-open-text" class="home-page__link-icon" aria-hidden="true" />
        <span>Blog</span>
      </NuxtLink>
    </nav>

    <NuxtLink
      class="home-page__image-link home-page__image-link--eu-fui"
      to="/livros/eu-fui-uma-boa-garota"
      aria-label="Conheça Eu Fui uma Boa Garota?"
    >
      <NuxtImg
        src="/imagens/eu-fui-uma-boa-garota/banner.webp"
        alt="Capa de Eu Fui uma Boa Garota?"
        :placeholder="[300, 404]"
        width="300"
        height="404"
      />
    </NuxtLink>

    <NuxtLink
      class="home-page__image-link home-page__image-link--trick-me"
      to="/livros/trick-me"
      aria-label="Conheça Trick Me: Spin-off de Ange na Amazon"
    >
      <NuxtImg
        src="/imagens/titulo_capa_trick_me.webp"
        alt="Trick Me: Um Spin-off de Ange"
        :placeholder="[300, 169]"
        width="300"
        height="169"
      />
    </NuxtLink>

    <NuxtLink
      class="home-page__image-link home-page__image-la-calamita"
      to="/livros/la-calamita"
      aria-label="Conheça La Calamità na Amazon"
    >
      <NuxtImg
        src="/imagens/titulo_capa_la_calamita.webp"
        alt="La Calamità"
        :placeholder="[300, 178]"
        width="300"
        height="178"
      />
      <span class="home-page__blood" aria-hidden="true">
        <span v-for="drop in 10" :key="drop" class="home-page__blood-drop" />
      </span>
    </NuxtLink>

    <NuxtLink
      class="home-page__image-link home-page__image-afrodite-ri"
      to="/livros/afrodite"
      aria-label="Conheça Afrodite na Amazon"
    >
      <NuxtImg
        src="/imagens/titulo_capa_afrodite.webp"
        alt="Dasha Cave"
        :placeholder="[300, 86]"
        width="300"
        height="86"
      />
    </NuxtLink>

    <NuxtLink
      class="home-page__image-link home-page__image-parque"
      to="/livros/o-parque-dos-pecados"
      aria-label="O Parque dos Pecados: Livro 1 - Série Vittorino na Amazon"
    >
      <NuxtImg
        src="/imagens/titulo_parque_dos_pecados.webp"
        alt="O Parque dos Pecados"
        width="1451"
        height="749"
      />
    </NuxtLink>

  </main>
</template>

<style scoped>
.home-page {
  box-sizing: border-box;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 3rem;
  color: #fff;
  text-align: center;
}

.home-page__title {
  margin: 0 0 1.5rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  text-shadow: 0 2px 4px rgb(0 0 0 / 60%);
}

.home-page__portrait-wrap {
  position: relative;
  width: min(60vw, 200px);
}

.home-page__portrait {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
}

.home-page__portrait-bubble {
  position: absolute;
  display: grid;
  width: 1.65rem;
  height: 1.65rem;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 4px 12px rgb(0 0 0 / 40%);
  font-size: 0.84rem;
}

.home-page__portrait-bubble--left-top {
  top: 56%;
  left: -5%;
}

.home-page__portrait-bubble--left-middle {
  top: 72%;
  left: -12%;
}

.home-page__portrait-bubble--left-bottom {
  bottom: -2%;
  left: 8%;
}

.home-page__portrait-bubble--right-top {
  top: 56%;
  right: -5%;
}

.home-page__portrait-bubble--right-middle {
  top: 72%;
  right: -12%;
}

.home-page__portrait-bubble--right-bottom {
  right: 8%;
  bottom: -2%;
}

.home-page__bio {
  width: min(100%, 520px);
  margin: 1.25rem auto 0.5rem;
  font-family: "Courier Prime", monospace;
  text-align: left;
}

.home-page__bio-text {
  margin: 0;
  color: rgb(255 255 255 / 92%);
  font-size: 0.975rem;
  line-height: 1.65;
  text-wrap: pretty;
}

.home-page__bio-details {
  margin-top: 0.5rem;
  color: rgb(255 255 255 / 92%);
  font-size: 0.975rem;
  line-height: 1.65;
  text-wrap: pretty;
}

.home-page__bio-details p {
  margin: 0;
}

.home-page__bio-details p + p {
  margin-top: 0.5rem;
}

.home-page__bio-toggle {
  min-width: 44px;
  min-height: 44px;
  margin-top: 0.25rem;
  padding: 0.5rem 0;
  border: 0;
  background: transparent;
  color: #00ffaa;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.home-page__bio-toggle--inline {
  display: inline;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  font-size: inherit;
  line-height: inherit;
  vertical-align: baseline;
}

.home-page__bio-toggle:hover {
  text-decoration: underline;
  text-underline-offset: 0.25rem;
}

.home-page__bio-toggle:focus-visible {
  border-radius: 4px;
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.home-page__image-link,
.home-page__link {
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

.home-page__image-la-calamita {
  isolation: isolate;
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

.home-page__link {
  padding: 0.85rem 1.25rem;
  background: linear-gradient(135deg, #0f382a 0%, #1b2622 100%);
  color: #00ffaa;
  font-weight: 600;
  text-decoration: none;
}

.home-page__image-link:hover,
.home-page__link:hover {
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

.home-page__link:hover {
  border-color: #00ffaa;
  background: linear-gradient(135deg, #154e3a 0%, #00ffaa 100%);
  box-shadow: 0 0 15px rgb(0 255 170 / 40%);
  color: #080a0c;
}

.home-page__image-link:focus-visible,
.home-page__link:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.home-page__navigation {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
  width: min(100%, 320px);
  margin: 0 auto;
}

.home-page__navigation .home-page__link {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 56px;
  margin: 0;
  gap: 0.1rem;
  padding: 0.35rem 0.1rem;
  border-radius: 12px;
  font-size: 0.6875rem;
  line-height: 1.15;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.home-page__link-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
  line-height: 1;
}

@keyframes blood-drip {
  0% { top: -20px; opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .home-page__image-link,
  .home-page__link {
    transition: none;
  }

  .home-page__blood-drop {
    animation: none;
  }
}

</style>
