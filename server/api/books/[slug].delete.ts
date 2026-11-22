import { removeBook } from '../../utils/books-db'
import { rejectDatabaseWrite } from '../../utils/database-write-lock'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  rejectDatabaseWrite()
  await requireAdminSession(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!removeBook(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Livro não encontrado' })
  }
  return { deleted: true }
})
