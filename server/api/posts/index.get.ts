import { selectPosts } from '../../utils/posts'

export default defineEventHandler(async () => {
  const db = await useDatabase()
  return await selectPosts(db)
})
