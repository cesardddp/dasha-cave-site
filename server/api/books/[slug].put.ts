import { findBook, updateBook } from '../../utils/books-db'
import { normalizeBookInput } from '../../utils/book-input'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const originalSlug = getRouterParam(event, 'slug') ?? ''
  if (!findBook(originalSlug)) {
    throw createError({ statusCode: 404, message: 'Livro não encontrado' })
  }

  const book = normalizeBookInput(await readBody(event))
  const slugOwner = findBook(book.slug)
  if (slugOwner && slugOwner.slug !== originalSlug) {
    throw createError({ statusCode: 409, message: 'Já existe um livro com esse endereço' })
  }

  return updateBook(originalSlug, book)
})
