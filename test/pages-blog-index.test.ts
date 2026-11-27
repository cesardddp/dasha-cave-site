import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'

import BlogIndexPage from '~/pages/blog/index.vue'

// O compositor inline só aparece para admin. useUserSession não existe fora
// de um servidor real, então substituímos o composable e controlamos a sessão.
const session = {
  loggedIn: ref(false),
  user: ref<{ name: string, role?: string } | null>(null),
  fetch: vi.fn(),
}


mockNuxtImport('useUserSession', () => () => session)

// Seam 3 (componente): página de listagem do blog. Blackbox.
// O ambiente 'nuxt' roda no browser (happy-dom) sem backend real, então
// mockamos a REDE com registerEndpoint — o componente continua recebendo
// dados pelo useFetch de verdade; apenas a resposta HTTP é controlada.
// Seam 3 (componente): página de listagem do blog. Blackbox.
// O ambiente 'nuxt' roda no browser (happy-dom) sem backend real, então
// mockamos a REDE com registerEndpoint — o componente continua consumindo
// via useBlogPosts → GraphQL; apenas a resposta HTTP de /api/graphql é
// controlada para o teste ser determinístico.
registerEndpoint('/api/graphql', () => ({
  data: {
    posts: [
      {
        id: 1,
        slug: 'zen-do-python',
        title: 'Zen do Python',
        description: 'Aforismos de Tim Peters.',
        content: 'Primeiro parágrafo do post.\n\nSegundo parágrafo com **destaque**.',
        image: null,
        badge: 'Single',
        publishedAt: '2025-11-14T21:00:00.000Z',
        author: { name: 'Dasha', avatar: null },
      },
    ],
  },
}))

describe('página Blog (listagem)', () => {
  beforeEach(() => {
    session.loggedIn.value = false
    session.user.value = null
  })

  it('renderiza o cabeçalho da página', async () => {
    const wrapper = await mountSuspended(BlogIndexPage)
    expect(wrapper.find('.blog-page__title').text()).toBe('Blog')
  })

  it('exibe os posts recebidos com link para o detalhe', async () => {
    const wrapper = await mountSuspended(BlogIndexPage)
    const links = wrapper.findAll('a')
      .map(l => l.attributes('href'))
      .filter(h => h?.startsWith('/blog/'))
    expect(links).toContain('/blog/zen-do-python')
  })

  it('renderiza o feed em lista vertical com o conteúdo completo', async () => {
    const wrapper = await mountSuspended(BlogIndexPage)

    const posts = wrapper.findAll('.feed__post')
    expect(posts).toHaveLength(1)
    expect(posts[0]!.find('.feed__title').text()).toBe('Zen do Python')

    const content = posts[0]!.find('.feed__content')
    const paragraphs = content.findAll('p')
    expect(paragraphs[1]!.text()).toContain('Segundo parágrafo')
    expect(content.find('strong').text()).toBe('destaque')
  })
})

describe('página Blog (compositor inline)', () => {
  it('mostra o compositor para administradores', async () => {
    session.loggedIn.value = true
    session.user.value = { name: 'Dasha', role: 'admin' }

    const wrapper = await mountSuspended(BlogIndexPage)

    expect(wrapper.find('.composer').exists()).toBe(true)
    expect(wrapper.find('.composer__title').text()).toBe('Novo post')
  })

  it('esconde o compositor de visitantes anônimos', async () => {
    session.loggedIn.value = false
    session.user.value = null

    const wrapper = await mountSuspended(BlogIndexPage)

    expect(wrapper.find('.composer').exists()).toBe(false)
  })

  it('esconde o compositor de quem está logado sem papel de admin', async () => {
    session.loggedIn.value = true
    session.user.value = { name: 'Visitante', role: 'commenter' }

    const wrapper = await mountSuspended(BlogIndexPage)

    expect(wrapper.find('.composer').exists()).toBe(false)
  })
})

describe('página Blog (imagem do post)', () => {
  const postImages = [
    { filename: '11111111-1111-1111-1111-111111111111.jpg', url: '/api/posts/images/11111111-1111-1111-1111-111111111111.jpg' },
  ]

  beforeEach(() => {
    session.loggedIn.value = true
    session.user.value = { name: 'Dasha', role: 'admin' }
  })

  it('oferece upload e bucket de imagens para administradores', async () => {
    registerEndpoint('/api/posts/images', () => postImages)

    const wrapper = await mountSuspended(BlogIndexPage)

    const input = wrapper.find('.composer__image-upload input[type="file"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('accept')).toBe('image/jpeg,image/png,image/webp')

    const toggle = wrapper.findAll('button')
      .find(button => button.text().includes('Escolher imagem do bucket'))
    expect(toggle).toBeTruthy()
    expect(toggle!.attributes('aria-expanded')).toBe('false')
  })

  it('não oferece upload de imagem a quem não é admin', async () => {
    session.user.value = { name: 'Visitante', role: 'commenter' }

    const wrapper = await mountSuspended(BlogIndexPage)

    expect(wrapper.find('.composer__image-upload input[type="file"]').exists()).toBe(false)
  })

  it('lista o bucket e aplica a imagem escolhida ao rascunho', async () => {
    registerEndpoint('/api/posts/images', () => postImages)

    const wrapper = await mountSuspended(BlogIndexPage)

    const toggle = wrapper.findAll('button')
      .find(button => button.text().includes('Escolher imagem do bucket'))
    await toggle!.trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.findAll('.composer__image-option')).toHaveLength(1)
    })

    await wrapper.findAll('.composer__image-option')[0]!.trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('.composer__image-preview img').exists()).toBe(true)
    })

    const preview = wrapper.find('.composer__image-preview img')
    expect(preview.exists()).toBe(true)
    expect(preview.attributes('src')).toBe(postImages[0]!.url)
  })
})
