import { findBook } from '../../utils/books-db'

export default defineEventHandler((event) => {
  const book = findBook(getRouterParam(event, 'slug') ?? '')
  if (!book) {
    throw createError({ statusCode: 404, message: 'Livro não encontrado' })
  }
  return book
})
