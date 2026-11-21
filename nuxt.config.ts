// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databasePath: '.data/blog.sqlite',
  },
  modules: ['@nuxt/ui', '@nuxt/fonts', '@nuxt/image', '@nuxt/icon', 'nuxt-auth-utils', 'nitro-graphql/nuxt'],
  nitro: {
    graphql: {
      framework: 'graphql-yoga',
    },
    modules: ['nitro-graphql'],
    compressPublicAssets: { gzip: true },
  },
})
