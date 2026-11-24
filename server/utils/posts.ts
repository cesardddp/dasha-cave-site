import { desc, eq } from 'drizzle-orm'
import { posts, users } from '../database/schema'

/**
 * Helper compartilhado entre os handlers REST e os resolvers GraphQL:
 * seleciona os campos de post + autor em uma única query com join.
 */
export async function selectPosts(db: Awaited<ReturnType<typeof useDatabase>>, slug?: string) {
  const query = db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      description: posts.description,
      content: posts.content,
      image: posts.image,
      badge: posts.badge,
      publishedAt: posts.publishedAt,
      authorName: users.name,
      authorAvatar: users.avatar,
      authorBio: users.bio,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .$dynamic()

  const rows = slug
    ? await query.where(eq(posts.slug, slug)).limit(1)
    : await query.orderBy(desc(posts.publishedAt))

  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    image: row.image,
    badge: row.badge,
    publishedAt: row.publishedAt,
    author: { name: row.authorName, avatar: row.authorAvatar, bio: row.authorBio },
  }))
}
