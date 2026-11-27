import { createSchema, createYoga } from 'graphql-yoga'
import { typeDefs } from '../../graphql/posts-schema'
import { selectPosts } from '../../utils/posts'

// Servido por GraphQL Yoga (mantido pela The Guild) no endpoint /api/graphql.
// Substitui o módulo nitro-graphql, que foi marcado como comprometido.

const resolvers = {
  Query: {
    posts: async () => {
      const db = await useDatabase()
      return await selectPosts(db)
    },

    postBySlug: async (_parent: unknown, args: { slug: string }) => {
      const db = await useDatabase()
      const [post] = await selectPosts(db, args.slug)
      return post ?? null
    },
  },
}

const yoga = createYoga<{ req: import('node:http').IncomingMessage }>({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  logging: false,
})

export default defineEventHandler((event) => {
  return yoga(event.node.req, event.node.res)
})
