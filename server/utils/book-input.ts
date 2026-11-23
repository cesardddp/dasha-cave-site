import type { Book } from '../../shared/types/book'

export function slugifyBookTitle(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function stringField(value: unknown, name: string, maximumLength = 500) {
  if (typeof value !== 'string' || value.length > maximumLength) {
    throw createError({ statusCode: 400, statusMessage: `Campo inválido: ${name}` })
  }
  return value.trim()
}

function listField(value: unknown, name: string, maximumItems: number, maximumLength: number) {
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw createError({ statusCode: 400, statusMessage: `Lista inválida: ${name}` })
  }

  return value.map((item) => {
    if (typeof item !== 'string' || item.length > maximumLength) {
      throw createError({ statusCode: 400, statusMessage: `Item inválido em ${name}` })
    }
    return item.trim()
  }).filter(Boolean)
}

export function normalizeAmazonUrl(value: unknown) {
  const rawUrl = stringField(value, 'amazonUrl', 2048)
  let url: URL

  try {
    url = new URL(rawUrl)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Informe um link válido da Amazon Brasil' })
  }

  if (
    url.protocol !== 'https:'
    || !['amazon.com.br', 'www.amazon.com.br'].includes(url.hostname)
    || url.port
    || url.username
    || url.password
    || !/\/dp\/[A-Z0-9]{10}(?:\/|$)/i.test(url.pathname)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Use um link de produto amazon.com.br com ASIN',
    })
  }

  return url.toString()
}

export function normalizeBookInput(value: unknown): Book {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({ statusCode: 400, statusMessage: 'Dados do livro inválidos' })
  }

  const body = value as Record<string, unknown>
  const title = stringField(body.title, 'title', 180)
  const slug = stringField(body.slug || slugifyBookTitle(title), 'slug', 80)
  const image = stringField(body.image ?? '', 'image', 500)

  if (!title || slug === 'admin' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Título ou endereço do livro inválido' })
  }

  if (
    image
    && (
      !/^\/(?:imagens|api\/books\/images)\/[a-zA-Z0-9._/-]+$/.test(image)
      || image.includes('..')
      || image.includes('//')
      || image.includes('\\')
    )
  ) {
    throw createError({ statusCode: 400, statusMessage: 'A imagem deve ser um arquivo local do site' })
  }

  const accent = stringField(body.accent ?? '#1a8173', 'accent', 7)
  if (!/^#[\da-f]{6}$/i.test(accent)) {
    throw createError({ statusCode: 400, statusMessage: 'A cor de destaque deve estar no formato #RRGGBB' })
  }

  const secondaryAccent = stringField(body.secondaryAccent ?? '#00626f', 'secondaryAccent', 7)
  if (!/^#[\da-f]{6}$/i.test(secondaryAccent)) {
    throw createError({ statusCode: 400, statusMessage: 'A cor secundária deve estar no formato #RRGGBB' })
  }

  return {
    slug,
    title,
    subtitle: stringField(body.subtitle ?? '', 'subtitle', 240),
    amazonUrl: normalizeAmazonUrl(body.amazonUrl),
    image,
    imageAlt: stringField(body.imageAlt || title, 'imageAlt', 240),
    themes: listField(body.themes, 'themes', 40, 100),
    synopsis: listField(body.synopsis, 'synopsis', 40, 3000),
    ageRating: stringField(body.ageRating ?? '', 'ageRating', 240),
    details: listField(body.details, 'details', 30, 240),
    accent,
    secondaryAccent,
  }
}
