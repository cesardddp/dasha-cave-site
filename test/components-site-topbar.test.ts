import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'

import SiteTopBar from '~/components/SiteTopBar.vue'

// Seam 3 (componente): barra superior discreta. O estado de sessão vem de
// useUserSession (nuxt-auth-utils), que não existe fora do servidor real —
// então substituímos o composable e controlamos apenas loggedIn/user.
const session = {
  loggedIn: ref(false),
  user: ref<{ name: string } | null>(null),
  fetch: vi.fn(),
}

mockNuxtImport('useUserSession', () => () => session)

describe('componente SiteTopBar', () => {
  it('mostra "Entrar" quando não há sessão', async () => {
    session.loggedIn.value = false
    session.user.value = null

    const wrapper = await mountSuspended(SiteTopBar)

    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).not.toContain('Sair')
  })

  it('mostra o nome do usuário e o link de sair quando logado', async () => {
    session.loggedIn.value = true
    session.user.value = { name: 'Dasha' }

    const wrapper = await mountSuspended(SiteTopBar)

    expect(wrapper.text()).toContain('Dasha')
    expect(wrapper.text()).toContain('Sair')
    expect(wrapper.text()).not.toContain('Entrar')
  })

  it('não desenha bordas nem fundo (barra discreta)', async () => {
    session.loggedIn.value = true
    session.user.value = { name: 'Dasha' }

    const wrapper = await mountSuspended(SiteTopBar)
    const nav = wrapper.find('nav')

    expect(nav.exists()).toBe(true)
    expect(nav.attributes('style') ?? '').not.toContain('border')
  })
})
