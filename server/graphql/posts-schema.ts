// Schema SDL do blog. Definido em TS (e não em arquivo .graphql) para ser
// empacotado junto do build do Nitro sem depender de leitura de arquivos
// em runtime. Servido por GraphQL Yoga em server/routes/api/graphql.ts.
export const typeDefs = /* GraphQL */ `
  type Author {
    name: String!
    avatar: String
    bio: String
  }

  type Post {
    id: Int!
    slug: String!
    title: String!
    description: String!
    content: String
    image: String
    badge: String
    publishedAt: String!
    author: Author!
  }

  type Query {
    """Posts ordenados por data de publicação (mais recente primeiro)."""
    posts: [Post!]!
    """Um único post pelo slug; null se não existir."""
    postBySlug(slug: String!): Post
  }
`
