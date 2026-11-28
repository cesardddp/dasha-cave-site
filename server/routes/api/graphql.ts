import { getRequestURL, readRawBody } from 'h3'
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

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  logging: false,
})

// A ponte crua `yoga(event.node.req, event.node.res)` quebra no preset `bun`:
// ali o Nitro entrega uma requisição mock (node-mock-http) cujo body é um
// ArrayBuffer, que o @whatwg-node/server não reconhece como BodyInit e acaba
// respondendo 400 em todo POST. Montamos uma Request/Response da Web a partir
// dos helpers do h3, que normalizam o body em qualquer runtime.
export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD'

  const request = new Request(getRequestURL(event), {
    method,
    headers: event.headers,
    body: hasBody ? await readRawBody(event, false) : undefined,
  })

  const response = await yoga.fetch(request)

  // Materializamos o body antes de devolver: o stream só sobrevive enquanto a
  // requisição original estiver aberta.
  const body = await response.arrayBuffer()

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
})
