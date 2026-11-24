import { normalizePostInput } from '../../utils/post-input'
import { updatePost } from '../../utils/posts'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const slug = getRouterParam(event, 'slug') ?? ''
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug obrigatório' })
  }

  const values = normalizePostInput(await readBody(event))

  const db = await useDatabase()
  const post = await updatePost(db, slug, values)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post não encontrado' })
  }

  return post
})
