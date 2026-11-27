import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineVitestProject({
  test: {
    globals: true,
    environment: 'nuxt',
    include: ['test/**/*.test.ts'],
    exclude: ['test/**/*.http.test.ts'],
    environmentOptions: {
      nuxt: {
        mock: { intersectionObserver: true },
      },
    },
  },
})
