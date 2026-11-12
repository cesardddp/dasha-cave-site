<template>
  <main class="home-page">
    <h1 class="home-page__title">Dasha Cave</h1>

    <NuxtImg 
      class="home-page__portrait"
      src="/imagens/dasha_icon.jpg"
      alt="Logo de Dasha Cave"
      width="300"
      height="300"
    />

    <NuxtLink
      class="home-page__image-link home-page__image-link--book"
      to="https://www.amazon.com.br/dp/B0HF65B8JV"
      aria-label="Conheça La Calamità na Amazon"
    >
      <NuxtImg
        src="/imagens/titulo_capa_la_calamita.png"
        alt="La Calamità"
        width="300"
        height="178"
      />
      <span class="home-page__blood" aria-hidden="true">
        <span v-for="drop in 10" :key="drop" class="home-page__blood-drop" />
      </span>
    </NuxtLink>

    <NuxtLink
      class="home-page__image-link home-page__image-link--reels"
      to="https://www.amazon.com.br/dp/B0GZLPN6L9"
      aria-label="Veja o conteúdo de Dasha Cave na Amazon"
    >
      <NuxtImg
        src="/imagens/titulo_capa_afrodite.png"
        alt="Dasha Cave"
        width="300"
        height="86"
      />
    </NuxtLink>

    <nav class="home-page__navigation" aria-label="Links da Dasha Cave">
      <NuxtLink
        class="home-page__link"
        to="https://www.amazon.com.br/stores/Dasha-Cave/author/B0G86SCW8B"
      >
        Amazon
      </NuxtLink>
      <NuxtLink
        class="home-page__link"
        to="https://www.instagram.com/autora_dashacave/"
      >
        Instagram
      </NuxtLink>
      <NuxtLink
        class="home-page__link"
        to="https://www.tiktok.com/@autora_dashacave"
      >
        TikTok
      </NuxtLink>
      <NuxtLink
        disabled
        class="home-page__link"
        to="https://dashacave.com.br/blog/"
      >
        Blog
      </NuxtLink>

    </nav>
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
  font-size: clamp(2rem, 6vw, 3rem);
  /* font-family: var(--font-display); */
  text-shadow: 0 2px 4px rgb(0 0 0 / 60%);
}

.home-page__portrait {
  display: block;
  width: min(60vw, 200px);
  height: auto;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
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

.home-page__image-link--book {
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

.home-page__image-link--book {
  margin-top: 1.5rem;
}

.home-page__image-link--reels {
  border-color: rgb(177 47 57 / 70%);
  background: linear-gradient(135deg, #190306 0%, #5e0b12 55%, #260307 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 55%), 0 0 12px rgb(116 12 22 / 30%);
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

.home-page__image-link--book:hover {
  border-color: rgb(126 255 238 / 90%);
  background: linear-gradient(135deg, #008f7d 0%, #00a0b5 100%);
  box-shadow: 0 0 15px rgb(0 210 190 / 45%);
}

.home-page__image-link--reels:hover {
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
  width: min(100%, 320px);
  margin-top: 0.75rem;
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
