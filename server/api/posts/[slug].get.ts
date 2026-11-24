import { selectPosts } from '../../utils/posts'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug obrigatório' })
  }

  const db = await useDatabase()
  const [post] = await selectPosts(db, slug)

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post não encontrado' })
  }

  return post
})
