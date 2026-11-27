import { createClient } from 'villus'

/**
 * Tipos do resultado espelhando o schema em server/graphql/posts.graphql.
 * A inferência automática via gql.tada exige o plugin TS @0no-co/graphqlsp
 * no editor; para o build usar tipos 100% confiáveis, declaramos os
 * resultados explicitamente — o contrato é o mesmo SDL validado nos testes
 * e2e (test/graphql-posts.http.test.ts), que falha se o schema divergir.
 */
export interface GqlAuthor {
  name: string
  avatar: string | null
  bio: string | null
}

export interface GqlPostSummary {
  id: number
  slug: string
  title: string
  description: string
  content: string | null
  image: string | null
  badge: string | null
  publishedAt: string
  author: { name: string, avatar: string | null }
}

export interface GqlPost extends GqlPostSummary {
  content: string
  author: GqlAuthor
}

/** Documentos GraphQL usados pelas páginas. */
export const PostsQuery = /* GraphQL */ `
  query Posts {
    posts {
      id
      slug
      title
      description
      content
      image
      badge
      publishedAt
      author {
        name
        avatar
      }
    }
  }
`

export const PostBySlugQuery = /* GraphQL */ `
  query PostBySlug($slug: String!) {
    postBySlug(slug: $slug) {
      id
      slug
      title
      description
      content
      image
      badge
      publishedAt
      author {
        name
        avatar
        bio
      }
    }
  }
`

interface GqlResponse<T> {
  data?: T
  errors?: { message: string }[]
}

/** Executa uma query contra /api/graphql usando o fetch do Nuxt. */
export async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await $fetch<GqlResponse<T>>('/api/graphql', {
    method: 'POST',
    body: { query, variables },
  })

  const firstError = response.errors?.[0]
  if (firstError) {
    throw new Error(`GraphQL: ${firstError.message}`)
  }

  return response.data as T
}

/**
 * Cliente villus compartilhado (para composables que usam useQuery).
 * SSR-friendly: roda no servidor durante o render e no client nas navegações.
 */
export function useGqlClient() {
  return createClient({
    url: '/api/graphql',
  })
}
