import { listBooks } from '../utils/books-db'

const siteUrl = 'https://dashacave.com.br'
const xmlEscapes: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '\'': '&apos;',
  '"': '&quot;',
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, character => xmlEscapes[character])
}

export default defineEventHandler((event) => {
  const paths = [
    '/',
    ...listBooks().map(book => `/livros/${encodeURIComponent(book.slug)}`),
  ]

  const urls = paths
    .map(path => `<url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`)
    .join('')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})
