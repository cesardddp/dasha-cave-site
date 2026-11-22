import { createBook, findBook } from '../../utils/books-db'
import { normalizeBookInput } from '../../utils/book-input'
import { rejectDatabaseWrite } from '../../utils/database-write-lock'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  rejectDatabaseWrite()
  await requireAdminSession(event)
  const book = normalizeBookInput(await readBody(event))

  if (findBook(book.slug)) {
    throw createError({ statusCode: 409, statusMessage: 'Já existe um livro com esse endereço' })
  }

  setResponseStatus(event, 201)
  return createBook(book)
})
