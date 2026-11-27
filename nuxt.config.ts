// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databasePath: '.data/blog.sqlite',
    booksDatabasePath: '.data/books.sqlite',
    adminUserIds: '',
    // Servidor SMTP. Sem host, os e-mails vão para o console.
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    mailFrom: '',
    // Com 'true', o e-mail é só impresso no console e o SMTP é ignorado.
    mailConsole: '',
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
