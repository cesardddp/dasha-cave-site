<script setup lang="ts">
import { shallowRef } from 'vue'

const bioExpanded = shallowRef(false)
</script>

<template>
  <div class="home-profile-links">
    <section class="home-page__bio" aria-label="Sobre Dasha Cave">
      <p
        class="home-page__bio-details"
      >
        Capricorniana, parte da comunidade LGBTQIAPN+ e neurodivergente.
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
        v-show="bioExpanded"
        id="dasha-cave-bio-details"
        class="home-page__bio-extra"
        aria-label="Mais sobre Dasha Cave"
      >
        Com formação em Filosofia e Nutrição, dedico-me à escrita de amores fora do convencional,
        explorando temas intensos, atmosferas sombrias, suspense e paixão.
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
        to="/blog/"
      >
        <Icon name="lucide:book-open-text" class="home-page__link-icon" aria-hidden="true" />
        <span>Blog</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.home-profile-links {
  width: min(100%, 520px);
  margin-inline: auto;
  text-align: left;
}

.home-page__bio {
  width: 100%;
  margin: 0 auto 0.5rem;
  font-family: "Courier Prime", monospace;
  text-align: left;
}

.home-page__bio-details {
  margin: 0;
  color: rgb(255 255 255 / 92%);
  font-size: 0.975rem;
  line-height: 1.65;
  text-wrap: pretty;
  transition: none;
}

.home-page__bio-details--expanded {
  margin-bottom: 0.25rem;
}

.home-page__bio-extra {
  margin-top: 0.25rem;
  color: rgb(255 255 255 / 92%);
  font-size: 0.975rem;
  line-height: 1.65;
  text-wrap: pretty;
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

.home-page__navigation {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
  width: min(100%, 320px);
  margin: 0 auto;
}

.home-page__link {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-height: 56px;
  margin: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.35rem 0.1rem;
  border: 1px solid rgb(112 230 218 / 45%);
  border-radius: 12px;
  background: linear-gradient(135deg, #0f382a 0%, #1b2622 100%);
  box-shadow: 0 4px 15px rgb(0 0 0 / 35%);
  color: #00ffaa;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.15;
  text-align: center;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.home-page__link:hover {
  transform: translateY(-2px);
  border-color: #00ffaa;
  background: linear-gradient(135deg, #154e3a 0%, #00ffaa 100%);
  box-shadow: 0 0 15px rgb(0 255 170 / 40%);
  color: #080a0c;
}

.home-page__link:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.home-page__link-icon {
  width: 1rem;
  height: 1rem;
  flex: 0 0 1rem;
  line-height: 1;
}
</style>
