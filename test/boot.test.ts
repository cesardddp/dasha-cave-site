import { describe, expect, it } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'

import App from '~/app.vue'
import { booksFixture } from './fixtures/books'

// Seam 3: boot da aplicação. Teria pegado os bugs de módulos órfãos
// (@nuxt/ui, nuxt-auth-utils) e runtimeConfig faltando que quebravam
// a app silenciosamente em runtime.
// A home faz useFetch('/api/books'); sem backend no ambiente 'nuxt',
// a rede precisa ser mockada para a página não estourar 404.
registerEndpoint('/api/books', () => booksFixture)

describe('boot da aplicação (home)', () => {
  it('monta a home sem quebrar', async () => {
    const wrapper = await mountSuspended(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('renderiza o conteúdo da home', async () => {
    const wrapper = await mountSuspended(App)
    const html = wrapper.html()
    expect(html.length).toBeGreaterThan(0)
    expect(html).not.toContain('nuxt-error-page')
  })
})
