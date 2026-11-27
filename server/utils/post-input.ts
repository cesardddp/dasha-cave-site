import { eq } from 'drizzle-orm'
import { posts } from '../database/schema'

type Database = Awaited<ReturnType<typeof useDatabase>>

export interface PostInput {
  title: string
  description: string
  content: string
  image: string | null
  badge: string | null
}

export function slugifyPostTitle(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Valida o corpo enviado pelo compositor. Título, descrição e conteúdo são
 * obrigatórios; imagem e badge são opcionais e viram `null` quando vazios.
 */
export function normalizePostInput(value: unknown): PostInput {
  const body = (value ?? {}) as Record<string, unknown>

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!title || !description || !content) {
    throw createError({
      statusCode: 400,
      message: 'Título, descrição e conteúdo são obrigatórios',
    })
  }

  return {
    title,
    description,
    content,
    image: optionalString(body.image),
    badge: optionalString(body.badge),
  }
}

export async function postSlugTaken(db: Database, slug: string) {
  const rows = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)
  return rows.length > 0
}

/**
 * Gera um slug livre a partir do título, sufixando `-2`, `-3`… quando o
 * endereço já está em uso (mesmo comportamento desde a criação de posts).
 */
export async function uniquePostSlug(db: Database, title: string) {
  const base = slugifyPostTitle(title) || 'post'

  let slug = base
  let attempt = 1

  while (await postSlugTaken(db, slug)) {
    attempt += 1
    slug = `${base}-${attempt}`
  }

  return slug
}
