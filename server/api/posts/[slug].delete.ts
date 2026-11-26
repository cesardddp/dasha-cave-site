import { removePost } from '../../utils/posts'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const slug = getRouterParam(event, 'slug') ?? ''
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' })
  }

  const db = await useDatabase()
  if (!await removePost(db, slug)) {
    throw createError({ statusCode: 404, message: 'Post não encontrado' })
  }

  return { deleted: true }
})
