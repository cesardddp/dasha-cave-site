<template>
  <div class="home-identity">
    <h1 class="home-page__title">Dasha Cave</h1>
    <h2 class="home-page__subtitle">
      Escritore de mundos sombrios e romances.<br>
      Entre o horror, o queer e o belo.
    </h2>

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
  </div>
</template>

<style scoped>
.home-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.home-page__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  text-shadow: 0 2px 4px rgb(0 0 0 / 60%);
}

.home-page__subtitle {
  margin: 0.25rem 0 1.25rem;
  font-family: "Courier Prime", monospace;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 700;
  line-height: 1.45;
  text-wrap: pretty;
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

.home-page__portrait-bubble--left-top { top: 56%; left: -5%; }
.home-page__portrait-bubble--left-middle { top: 72%; left: -12%; }
.home-page__portrait-bubble--left-bottom { bottom: -2%; left: 8%; }
.home-page__portrait-bubble--right-top { top: 56%; right: -5%; }
.home-page__portrait-bubble--right-middle { top: 72%; right: -12%; }
.home-page__portrait-bubble--right-bottom { right: 8%; bottom: -2%; }
</style>
