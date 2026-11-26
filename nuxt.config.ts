// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databasePath: '.data/blog.sqlite',
    booksDatabasePath: '.data/books.sqlite',
    adminUserIds: '',
    // Relay HTTP do servidor de e-mail. Sem ele, os e-mails vão para o console.
    mailEndpoint: '',
    mailToken: '',
    mailFrom: 'Caverna da Dasha <nao-responda@dashacave.com.br>',
    public: {
      // Base usada para montar os links enviados por e-mail.
      siteUrl: '',
    },
  },
  modules: ['@nuxt/ui', '@nuxt/fonts', '@nuxt/image', '@nuxt/icon', 'nuxt-auth-utils'],
  nitro: {
    compressPublicAssets: { gzip: true },
  },
})
