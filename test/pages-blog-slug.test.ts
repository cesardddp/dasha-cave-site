import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'

import BlogPostPage from '~/pages/blog/[slug].vue'

// Seam 3 (componente): página de detalhe do post. Blackbox com a rede
// mockada via registerEndpoint (o ambiente 'nuxt' não tem backend real).
// Seam 3 (componente): página de detalhe do post. Blackbox com a rede
// mockada via registerEndpoint (o ambiente 'nuxt' não tem backend real).
// O useBlogPost envia POST /api/graphql com a variável slug.
registerEndpoint('/api/graphql', event => ({
  data: {
    postBySlug: {
      id: 1,
      slug: 'afrodite',
      title: 'Afrodite: o novo single',
      description: 'Guitarras densas.',
      content: '## Afrodite\n\n**Afrodite** nasceu de uma noite inteira.',
      image: null,
      badge: 'Single',
      publishedAt: '2025-11-14T21:00:00.000Z',
      author: { name: 'Dasha', avatar: null, bio: 'Anfitriã da caverna.' },
    },
  },
}))

describe('página Blog (detalhe)', () => {
  it('renderiza o conteúdo markdown do post', async () => {
    const wrapper = await mountSuspended(BlogPostPage, {
      route: { params: { slug: 'afrodite' } },
    })
    // O marked converte "## Afrodite" em <h2>
    expect(wrapper.find('h2').text()).toBe('Afrodite')
  })

  it('usa o título do post no link de volta para /blog', async () => {
    const wrapper = await mountSuspended(BlogPostPage, {
      route: { params: { slug: 'afrodite' } },
    })
    const back = wrapper.find('.post-page__back')
    expect(back.attributes('href')).toBe('/blog')
  })
})
