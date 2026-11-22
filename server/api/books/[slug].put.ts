import { findBook, updateBook } from '../../utils/books-db'
import { normalizeBookInput } from '../../utils/book-input'
import { rejectDatabaseWrite } from '../../utils/database-write-lock'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  rejectDatabaseWrite()
  await requireAdminSession(event)
  const originalSlug = getRouterParam(event, 'slug') ?? ''
  if (!findBook(originalSlug)) {
    throw createError({ statusCode: 404, statusMessage: 'Livro não encontrado' })
  }

  const book = normalizeBookInput(await readBody(event))
  const slugOwner = findBook(book.slug)
  if (slugOwner && slugOwner.slug !== originalSlug) {
    throw createError({ statusCode: 409, statusMessage: 'Já existe um livro com esse endereço' })
  }

  return updateBook(originalSlug, book)
})
