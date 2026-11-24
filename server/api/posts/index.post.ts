import { posts } from '../../database/schema'
import { normalizePostInput, uniquePostSlug } from '../../utils/post-input'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  const user = await requireAdminSession(event)
  const values = normalizePostInput(await readBody(event))

  const db = await useDatabase()
  const slug = await uniquePostSlug(db, values.title)

  const [created] = await db
    .insert(posts)
    .values({
      slug,
      ...values,
      authorId: user.id,
    })
    .returning({ slug: posts.slug })

  setResponseStatus(event, 201)
  return created
})
