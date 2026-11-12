<template>
  <main class="home-page">
    <h1 class="home-page__title">Dasha Cave</h1>

    <img
      class="home-page__portrait"
      src="https://dashacave.com.br/wp-content/uploads/2026/11/610182193_18156471886413559_6505351523151818185_n-300x300.jpg"
      alt="Dasha Cave"
      width="300"
      height="300"
    >

    <div class="home-page__book">
      <img
        class="home-page__book-title"
        src="https://dashacave.com.br/wp-content/uploads/2026/11/tituloempngbranco-recortado3-300x178.png"
        alt="La Calamità"
        width="300"
        height="178"
      >
      <div class="home-page__blood" aria-hidden="true">
        <span v-for="drop in 10" :key="drop" class="home-page__blood-drop" />
      </div>
    </div>

    <a
      class="home-page__link home-page__link--launch"
      href="https://www.amazon.com.br/dp/B0HF65B8JV"
      target="_blank"
      rel="noopener noreferrer"
    >
      La Calamità — lançamento disponível
    </a>

    <img
      class="home-page__brand"
      src="https://dashacave.com.br/wp-content/uploads/2026/11/TITULOEMPNGBRANCO-recortado-300x86.png"
      alt="Dasha Cave"
      width="300"
      height="86"
    >

    <nav class="home-page__navigation" aria-label="Links da Dasha Cave">
      <a class="home-page__link" href="https://dashacave.com.br/blog/">Blog</a>
      <a
        class="home-page__link"
        href="https://www.amazon.com.br/stores/Dasha-Cave/author/B0G86SCW8B"
        target="_blank"
        rel="noopener noreferrer"
      >
        Amazon
      </a>
      <a
        class="home-page__link"
        href="https://www.instagram.com/autora_dashacave/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Instagram
      </a>
      <a
        class="home-page__link"
        href="https://www.tiktok.com/@autora_dashacave"
        target="_blank"
        rel="noopener noreferrer"
      >
        TikTok
      </a>
    </nav>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: linear-gradient(165deg, #2e9974 0%, #111417 50%, #060809 100%);
}

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

.home-page__book {
  position: relative;
  display: grid;
  width: min(100%, 360px);
  min-height: 178px;
  place-items: center;
  margin: 1.5rem 0 0.75rem;
  overflow: hidden;
}

.home-page__book-title {
  display: block;
  width: min(100%, 300px);
  height: auto;
}

.home-page__blood {
  position: absolute;
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

.home-page__link {
  box-sizing: border-box;
  display: block;
  width: min(100%, 320px);
  margin: 0.45rem auto;
  padding: 0.85rem 1.25rem;
  border: 1px solid rgb(112 230 218 / 45%);
  border-radius: 999px;
  background: linear-gradient(135deg, #005d50 0%, #00626f 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 35%);
  color: #eaffff;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.home-page__link:hover {
  transform: translateY(-2px);
  border-color: rgb(126 255 238 / 90%);
  background: linear-gradient(135deg, #008f7d 0%, #00a0b5 100%);
  box-shadow: 0 0 15px rgb(0 210 190 / 45%);
}

.home-page__link:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.home-page__link--launch {
  margin-top: 0.75rem;
}

.home-page__brand {
  display: block;
  width: min(100%, 300px);
  height: auto;
  margin: 1.25rem 0;
}

.home-page__navigation {
  width: min(100%, 320px);
}

@keyframes blood-drip {
  0% { top: -20px; opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .home-page__blood-drop {
    animation: none;
  }

  .home-page__link {
    transition: none;
  }
}
</style>
