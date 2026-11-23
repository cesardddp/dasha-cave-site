import { initialBooks } from '../../shared/data/books'
import type { Book } from '../../shared/types/book'
import { normalizeAmazonUrl, slugifyBookTitle } from './book-input'
import { readLimitedResponse, saveBookImage } from './book-images'
import { extractImagePalette } from './image-palette'

const maximumAmazonPageSize = 2 * 1024 * 1024
const maximumAmazonImageSize = 5 * 1024 * 1024
const knownThemePhrases = [...new Set([
  ...initialBooks.flatMap(book => book.themes),
  'Romance sáfico futurista',
  'Dark Romance leve',
  'Stalker e obsessão',
  'Humana x Androide',
])].sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length)

export interface AmazonBookImportResult {
  book: Book
  warnings: string[]
}

function cleanMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractThemes(value: string) {
  const heading = value.match(/^#{4,6}\s+(.+)$/m)?.[1]
  if (!heading)
    return []

  const text = cleanMarkdown(heading)
  if (!text)
    return []

  const separatedThemes = text
    .split(/\s+(?:-|–|—)\s+|[,;|•]\s*/)
    .map(theme => theme.trim())
    .filter(Boolean)

  if (separatedThemes.length > 1)
    return separatedThemes.slice(0, 30)

  const words = text.split(/\s+/)
  const themes: string[] = []

  for (let index = 0; index < words.length;) {
    const knownTheme = knownThemePhrases.find((theme) => {
      const themeWords = theme.split(/\s+/)
      return words.slice(index, index + themeWords.length).join(' ').toLowerCase() === theme.toLowerCase()
    })

    if (knownTheme) {
      const themeWords = knownTheme.split(/\s+/)
      themes.push(words.slice(index, index + themeWords.length).join(' '))
      index += themeWords.length
    }
    else if (['e', 'x', '&'].includes(words[index + 1]?.toLowerCase()) && words[index + 2]) {
      themes.push(words.slice(index, index + 3).join(' '))
      index += 3
    }
    else {
      themes.push(words[index])
      index++
    }
  }

  return themes.slice(0, 30)
}

function extractSynopsis(value: string) {
  const paragraphs = value
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/^\s*\*+\s*$/gm, '')
    .replace(/^\s*\[Leia mais\].*$/gm, '')
    .split(/\n\s*\n/)
    .map(paragraph => cleanMarkdown(paragraph))
    .filter(paragraph => paragraph.length > 30 && !/^imagem não disponível/i.test(paragraph))

  return paragraphs.slice(0, 12)
}

function cleanAmazonProductTitle(value: string) {
  return value
    .replace(/:\s*Amazon\.com\.br(?::.*)?$/i, '')
    .replace(/\s+(?:eBook|Livro)\s*:\s*.+$/i, '')
    .replace(/\s+(?:eBook|Livro)\s*$/i, '')
    .trim()
}

function extractProductTitle(markdown: string) {
  const metadataTitle = markdown.match(/^Title:\s*(.+)$/im)?.[1]
  if (metadataTitle)
    return cleanAmazonProductTitle(metadataTitle)

  const ignoredHeading = /^(?:seguir o autor|ir para|como funciona|comprar como presente)$/i
  return [...markdown.matchAll(/^#\s+(.+)$/gm)]
    .map(([, heading]) => heading.trim())
    .find(heading => !ignoredHeading.test(heading))
}

function splitProductTitle(productTitle: string) {
  const seriesTitle = productTitle.match(/^(.*?)\s+\(([^()]*(?:livro|book|vol(?:ume)?|série|series)\s*\d*[^()]*)\)$/i)
  if (seriesTitle?.[1].trim()) {
    return {
      title: seriesTitle[1].trim(),
      subtitle: seriesTitle[2].trim(),
    }
  }

  const [title, ...subtitleParts] = productTitle.split(/\s*:\s*/)
  return {
    title: title.trim(),
    subtitle: subtitleParts.join(' — ').trim(),
  }
}

function extractImageUrl(markdown: string, title: string) {
  const titleWords = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word.length > 2)
    .slice(0, 2)

  const images = [...markdown.matchAll(/!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g)]
  const match = images.find(([, alt, imageUrl]) => {
    if (!/\/images\/I\//.test(imageUrl)) return false
    const normalizedAlt = alt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    return titleWords.length > 0 && titleWords.every(word => normalizedAlt.includes(word))
  })

  if (!match) return null

  try {
    const imageUrl = new URL(match[2])
    if (
      imageUrl.protocol !== 'https:'
      || !['m.media-amazon.com', 'images-na.ssl-images-amazon.com'].includes(imageUrl.hostname)
      || imageUrl.port
      || imageUrl.username
      || imageUrl.password
    ) {
      return null
    }

    imageUrl.pathname = imageUrl.pathname.replace(/\._[^.]+_\.(jpe?g|png|webp)$/i, '._SY1000_.$1')
    return imageUrl.toString()
  }
  catch {
    return null
  }
}

async function fetchAmazonPage(asin: string) {
  let response: Response
  try {
    response = await fetch(`https://r.jina.ai/http://www.amazon.com.br/dp/${asin}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(20_000),
    })
  }
  catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
    throw createError({
      statusCode: timedOut ? 504 : 502,
      statusMessage: timedOut
        ? 'A Amazon demorou demais para responder'
        : 'Não foi possível consultar a página da Amazon',
    })
  }

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `A consulta à Amazon falhou (HTTP ${response.status})`,
    })
  }

  const data = await readLimitedResponse(response, maximumAmazonPageSize)
  return new TextDecoder().decode(data)
}

async function fetchAmazonCover(url: string) {
  let response: Response
  try {
    response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    })
  }
  catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Os dados foram importados, mas não foi possível baixar a capa. Envie a imagem manualmente.',
    })
  }

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `A Amazon não entregou a capa (HTTP ${response.status}). Envie a imagem manualmente.`,
    })
  }

  return readLimitedResponse(response, maximumAmazonImageSize)
}

export async function importAmazonBook(value: unknown): Promise<AmazonBookImportResult> {
  const amazonUrl = normalizeAmazonUrl(value)
  const asin = new URL(amazonUrl).pathname.match(/\/dp\/([A-Z0-9]{10})/i)?.[1].toUpperCase()
  if (!asin) {
    throw createError({ statusCode: 400, statusMessage: 'Não foi possível identificar o ASIN no link' })
  }

  const markdown = await fetchAmazonPage(asin)
  const amazonTitle = extractProductTitle(markdown)

  if (!amazonTitle || /amazon\.com\.br/i.test(amazonTitle) || /^seguir o autor$/i.test(amazonTitle)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Não encontrei os dados do livro na Amazon. Confira o link e tente novamente.',
    })
  }

  const { title, subtitle } = splitProductTitle(amazonTitle)
  const headingIndex = markdown.indexOf(`# ${amazonTitle}`)
  const start = headingIndex >= 0 ? headingIndex : markdown.indexOf(amazonTitle)
  const separator = start >= 0 ? markdown.indexOf('* * *', start) : -1
  const readMore = separator >= 0 ? markdown.indexOf('[Leia mais]', separator) : -1
  const description = separator >= 0 && readMore > separator
    ? markdown.slice(separator + '* * *'.length, readMore)
    : ''
  const imageUrl = extractImageUrl(markdown, title)
  const warnings: string[] = []
  let downloadedImage = ''
  let accent = initialBooks[0].accent
  let secondaryAccent = initialBooks[0].secondaryAccent
  let coverData: Uint8Array | undefined
  if (imageUrl) {
    try {
      coverData = await fetchAmazonCover(imageUrl)
    }
    catch (cause) {
      const message = cause && typeof cause === 'object' && 'statusMessage' in cause
        && typeof cause.statusMessage === 'string'
        ? cause.statusMessage
        : cause instanceof Error
          ? cause.message
          : 'Não foi possível baixar a capa. Envie a imagem manualmente.'
      warnings.push(message)
    }

    if (coverData) {
      try {
        downloadedImage = await saveBookImage(coverData)
      }
      catch (cause) {
        const message = cause && typeof cause === 'object' && 'statusMessage' in cause
          && typeof cause.statusMessage === 'string'
          ? cause.statusMessage
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível salvar a capa. Envie a imagem manualmente.'
        warnings.push(message)
      }

      try {
        const palette = await extractImagePalette(coverData)
        accent = palette.accent
        secondaryAccent = palette.secondaryAccent
      }
      catch {
        warnings.push('Não consegui identificar as cores da capa; escolha as cores manualmente antes de salvar.')
      }
    }
  }
  else {
    warnings.push('Não encontrei a capa na página. Envie uma imagem manualmente.')
  }

  if (!coverData)
    warnings.push('Não consegui sugerir cores sem a capa; escolha as cores manualmente antes de salvar.')

  const themes = extractThemes(description)
  const synopsis = extractSynopsis(description)
  if (themes.length === 0)
    warnings.push('Não encontrei temas automaticamente; adicione-os antes de salvar.')
  if (synopsis.length === 0)
    warnings.push('Não encontrei a sinopse automaticamente; preencha-a antes de salvar.')
  const details: string[] = []
  const pages = markdown.match(/Número de páginas[\s\S]{0,100}?(\d{1,5})\s+páginas/i)?.[1]
  const publicationDate = markdown.match(/Data da publicação\s+(\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+\d{4})/i)?.[1]
  const rating = markdown.match(/\[(\d[,.]\d)\s+de 5 estrelas\]/i)?.[1]
  if (pages) details.push(`${pages} páginas`)
  details.push('Português')
  if (publicationDate) details.push(publicationDate)
  if (rating) details.push(`Amazon: ${rating.replace(',', '.')} de 5`)

  const ageRating = /maiores de 18|maior de 18|18 anos/i.test(description)
    ? 'Leitura indicada para maiores de 18 anos. Consulte os avisos de conteúdo na Amazon.'
    : ''

  return {
    book: {
      slug: slugifyBookTitle(title),
      title,
      subtitle,
      amazonUrl,
      image: downloadedImage,
      imageAlt: title,
      themes,
      synopsis,
      ageRating,
      details,
      accent,
      secondaryAccent,
    },
    warnings,
  }
}
