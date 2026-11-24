// Config dedicado aos testes de integração HTTP (seam 1/2).
// NÃO usar defineVitestConfig/defineVitestProject aqui: eles injetam a define
// __NUXT_VITEST_RESOLVED__, que faz o setup({ server: true }) de
// @nuxt/test-utils/e2e se recusar a rodar. Este config é "vanilla".
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // @nuxt/test-utils importa "bun:test" estaticamente (só usado quando o
      // runner é bun); sob vitest nunca executa, mas o Vite tenta empacotar.
      'bun:test': resolve(import.meta.dirname, 'test/stubs/bun-test.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.http.test.ts'],
  },
})
