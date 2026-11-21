<script setup lang="ts">
import { computed } from 'vue'

interface Book {
  title: string
  subtitle?: string
  amazonUrl: string
  image?: string
  imageAlt: string
  themes: string[]
  synopsis: string[]
  ageRating?: string
  details: string[]
  imageNeeded: boolean
  accent: string
}

const books: Record<string, Book> = {
  'eu-fui-uma-boa-garota': {
    title: 'Eu Fui uma Boa Garota?',
    amazonUrl: 'https://www.amazon.com.br/dp/B0HRP7B81F?utm_source=dashacave.com.br&utm_medium=link_divulgacao&utm_campaign=lancamento_eu_fui_uma_boa_garota',
    image: '/imagens/capas/eu-fui-uma-boa-garota.jpg',
    imageAlt: 'Capa de Eu Fui uma Boa Garota?',
    themes: ['Monster Romance sáfico', 'Natal', 'Age Gap', 'Found Family', 'Grumpy x Sunshine', 'Friends to Lovers', 'Comédia romântica'],
    synopsis: [
      'Sora e Mia estão oficialmente encrencadas neste Natal.',
      'Depois de serem expulsas de Faer, elas recebem uma missão no mundo humano: ajudar Hammer — um idoso em luto — a manter aberta uma confeitaria que construiu com a esposa e entregar as encomendas natalinas mais aguardadas da cidade de Crystal.',
      'Como se isso não fosse complicado o bastante, elas precisam esconder suas verdadeiras aparências e finalmente enfrentar sentimentos que não conseguem mais manter em segredo.',
      'Uma novela sáfica curtinha e aconchegante, com feéricas, um romance delicado e pitadas de magia, além de boas doses de provocações.',
    ],
    ageRating: 'Romance com temas maduros.',
    details: ['Novela', 'Português', 'Pré-venda até 15/12/2026'],
    imageNeeded: false,
    accent: '#8f2632',
  },
  'trick-me': {
    title: 'Trick Me',
    subtitle: 'Um spin-off de Ange',
    amazonUrl: 'https://www.amazon.com.br/dp/B0HLK3XK71/?utm_source=dashacave.com.br&utm_medium=link_divulgacao&utm_content=listagem_trick_me',
    image: '/imagens/capas/trick-me.jpg',
    imageAlt: 'Trick Me: Um Spin-off de Ange',
    themes: ['Dark Romance sáfico', 'Ficção futurista', 'Monster Romance', 'Erus Program', 'Halloween'],
    synopsis: [
      'Trix e sua androide são um casal assumido e muito bem resolvido após a descoberta da obsessão de Sage, da paixão mútua e das artimanhas de Cristopher Valler — o CEO da empresa robótica Brax e pai de Trix.',
      'Trick Me mergulha ainda mais fundo na dinâmica moralmente cinzenta das personagens em um conto de Halloween que promete roubar o fôlego.',
      'Este é um conto hot e dark sobre o casal sáfico mais insano de 2110.',
    ],
    ageRating: 'Conto hot e dark para maiores de 18 anos. Leia a lista de gatilhos.',
    details: ['84 páginas', 'Português', '28/10/2026', 'Erus Program'],
    imageNeeded: false,
    accent: '#9f202d',
  },
  'la-calamita': {
    title: 'La Calamità',
    amazonUrl: 'https://www.amazon.com.br/dp/B0HF65B8JV?utm_source=dashacave.com.br&utm_medium=link_divulgacao&utm_content=listagem_la_calamita',
    subtitle: 'Um horror romântico sáfico — Pílulas do Apocalipse',
    image: '/imagens/capas/la-calamita.jpg',
    imageAlt: 'La Calamità',
    themes: ['Horror romântico sáfico', 'Suspense', 'Ficção científica intimista', 'Lovecraftiano', 'Pílulas do Apocalipse'],
    synopsis: [
      'Na pequena cidade de Caldeia, um surto viral aparentemente comum começa a se espalhar entre os pacientes do hospital local.',
      'Alex, uma enfermeira em meio ao colapso da rotina hospitalar, percebe padrões que ninguém mais está disposto ou é capaz de enxergar. Marcada pelo preconceito velado de Caldeia, pela loucura como maldição familiar e pelo fantasma de um passado como lutadora profissional, ela começa uma investigação perigosa.',
      'No centro do caos está Eva, cuja presença se torna pouco a pouco um ponto de atração impossível de ignorar. Uma relação movida por desejo, entrega e intensidade.',
      'La Calamità representa o pecado da Inveja na série Pílulas do Apocalipse.',
    ],
    ageRating: 'Recomendado para maiores de 18 anos. Leia a lista de gatilhos.',
    details: ['290 páginas', 'Português', '20/09/2026', 'Pílulas do Apocalipse — 2º livro'],
    imageNeeded: false,
    accent: '#1a8173',
  },
  afrodite: {
    title: 'Afrodite Ri',
    subtitle: 'Uma lírica canibalesca — Pílulas do Apocalipse',
    amazonUrl: 'https://www.amazon.com.br/dp/B0GZLPN6L9?utm_source=dashacave.com.br&utm_medium=link_divulgacao&utm_content=listagem_afrodite',
    image: '/imagens/capas/afrodite-ri.jpg',
    imageAlt: 'Afrodite Ri',
    themes: ['Romance sáfico', 'Monster Romance', 'Conto', 'Dark Romance', 'Grumpy x Sunshine', 'Fast Burn', 'Pílulas do Apocalipse'],
    synopsis: [
      'Sophia é uma bruxa iniciante que nunca buscou poder, apenas respostas.',
      'Ao encontrar um livro antigo esquecido em um antiquário, ela decide arriscar uma evocação proibida, guiada pela promessa de conhecimento.',
      'A entidade que atende ao seu chamado não veio para ensinar. Ela veio para propor algo muito mais intenso.',
      'Afrodite Ri representa o pecado da Gula na série Pílulas do Apocalipse.',
    ],
    ageRating: 'Conto para maiores de 18 anos. Leia a lista de gatilhos.',
    details: ['44 páginas', 'Português', '10/06/2026', 'Pílulas do Apocalipse — 1º livro'],
    imageNeeded: false,
    accent: '#a52a36',
  },
  'o-parque-dos-pecados': {
    title: 'O Parque dos Pecados',
    subtitle: 'Livro 1 — Série Vittorino',
    amazonUrl: 'https://www.amazon.com.br/dp/B0GTX2DWJZ?utm_source=dashacave.com.br&utm_medium=link_divulgacao&utm_content=listagem_parque_dos_pecados',
    image: '/imagens/capas/o-parque-dos-pecados.jpg',
    imageAlt: 'O Parque dos Pecados',
    themes: ['Monster Romance', 'Crítica social', 'Cidade pequena', 'Legado familiar', 'Dark Romance', 'Predestinados', 'Proximidade forçada', 'Hot'],
    synopsis: [
      'Bem-vindos ao Parque dos Pecados. Onde o terror é real e o monstro é quem você mais deseja.',
      'Luna Vittorino herdou mais do que um parque de diversões em decadência; ela herdou um legado de sangue e segredos que a cidade de Tersal prefere manter enterrados.',
      'Para salvar o patrimônio da família da falência e das garras da elite local, Luna precisa transformar uma antiga estufa vitoriana em uma atração de horror tão realista que os gritos sejam ouvidos em toda a região.',
      'Quando três estranhos enigmáticos aparecem, Luna sente que algo mudou. Especialmente com Nox, uma figura magnética que parece conhecer os segredos dos Vittorino melhor do que a própria Luna.',
      'À medida que o Jardim dos Horrores ganha vida, a linha entre encenação e realidade desaparece.',
    ],
    ageRating: 'Livro para maiores de 18 anos.',
    details: ['243 páginas', 'Português', '10/04/2026', 'Série Vittorino — livro 1'],
    imageNeeded: false,
    accent: '#b44b87',
  },
}

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const book = computed(() => books[slug.value])

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
        <NuxtImg
          v-if="book.image"
          class="book-page__art-image"
          :src="book.image"
          :alt="book.imageAlt"
          :placeholder="[400, 540]"
          width="400"
          height="540"
        />
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
