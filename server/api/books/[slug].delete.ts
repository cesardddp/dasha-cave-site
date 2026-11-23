import { removeBook } from '../../utils/books-db'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!removeBook(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Livro não encontrado' })
  }
  return { deleted: true }
})
