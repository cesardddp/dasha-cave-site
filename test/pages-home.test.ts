import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'

import IndexPage from '~/pages/index.vue'
import { booksFixture } from './fixtures/books'

// Seam 3 (componente): página Home. Blackbox — assert no que o usuário vê
// (títulos, links), nunca em estado interno do componente.
// A home faz useFetch('/api/books'); no ambiente 'nuxt' (happy-dom) não há
// backend, então mockamos a REDE e deixamos o useFetch real consumir.
registerEndpoint('/api/books', () => booksFixture)

describe('página Home', () => {
  it('renderiza o título', async () => {
    const wrapper = await mountSuspended(IndexPage)
    expect(wrapper.find('.home-page__title').text()).toBe('Dasha Cave')
  })

  it('tem páginas internas para todos os livros', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const links = wrapper.findAll('a')
    const hrefs = links.map(l => l.attributes('href'))
    expect(hrefs).toContain('/livros/eu-fui-uma-boa-garota')
    expect(hrefs).toContain('/livros/trick-me')
    expect(hrefs).toContain('/livros/la-calamita')
    expect(hrefs).toContain('/livros/afrodite')
    expect(hrefs).toContain('/livros/o-parque-dos-pecados')
  })

  it('exibe textos alternativos nas imagens (acessibilidade)', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const imgs = wrapper.findAll('img')
    expect(imgs.length).toBeGreaterThan(0)
    for (const img of imgs) {
      expect(img.attributes('alt')).toBeTruthy()
    }
  })
})
