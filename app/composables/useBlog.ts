import { PostsQuery, PostBySlugQuery, gqlFetch, type GqlPost, type GqlPostSummary } from '~/graphql/graphql-env'

/**
 * Lista de posts, ordenada do mais recente para o mais antigo.
 * Envolvida em useAsyncData para SSR + dedupe entre componentes.
 */
export function useBlogPosts() {
  return useAsyncData(
    'blog-posts',
    async () => {
      const { posts } = await gqlFetch<{ posts: GqlPostSummary[] }>(PostsQuery)
      return posts
    },
  )
}

/**
 * Um post pelo slug. `null` quando não existe (a página decide
 * entre 404 e estado vazio).
 */
export function useBlogPost(slug: string) {
  return useAsyncData(
    `blog-post-${slug}`,
    async () => {
      const { postBySlug } = await gqlFetch<{ postBySlug: GqlPost | null }>(PostBySlugQuery, { slug })
      return postBySlug
    },
  )
}
