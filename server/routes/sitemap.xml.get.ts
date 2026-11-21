const siteUrl = 'https://dashacave.com.br'
const paths = [
  '/',
  '/livros/eu-fui-uma-boa-garota',
  '/livros/trick-me',
  '/livros/la-calamita',
  '/livros/afrodite',
  '/livros/o-parque-dos-pecados',
]

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  const urls = paths
    .map(path => `<url><loc>${siteUrl}${path}</loc></url>`)
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})
