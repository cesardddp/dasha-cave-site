import { selectPosts } from '../../utils/posts'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug obrigatório' })
  }

  const db = await useDatabase()
  const [post] = await selectPosts(db, slug)

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post não encontrado' })
  }

  return post
})
