import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

// Seam 1: API GraphQL. Testa o comportamento observável por HTTP —
// validação do schema, forma da resposta e o autor aninhado.
// Usa um servidor Nuxt real (server: true), sem mock de internals.
// setup() precisa ser chamado no top-level do arquivo (padrão da doc),
// não dentro de beforeAll — ele registra os hooks do runner ele mesmo.
await setup({ server: true, setupTimeout: 120_000 })

async function gql(query: string) {
  return await $fetch('/api/graphql', {
    method: 'POST',
    body: { query },
  }) as { data?: Record<string, unknown>, errors?: { message: string }[] }
}

describe('sanity: servidor e2e no ar', () => {
  it('REST /api/posts responde (prova que o server subiu)', async () => {
    const posts = await $fetch('/api/posts') as Array<{ slug: string }>
    expect(posts.length).toBeGreaterThan(0)
  })
})

describe('REST: criação de post exige administrador', () => {
  it('rejeita POST /api/posts sem sessão (401/403)', async () => {
    // Só o caminho não autorizado: criar post de verdade deixaria lixo no banco.
    const error = await $fetch('/api/posts', {
      method: 'POST',
      body: { title: 'Intruso', description: 'Sem permissão', content: 'Nada aqui.' },
    }).then(
      () => null,
      (caught: { status?: number, statusCode?: number }) => caught,
    )

    expect(error).toBeTruthy()
    expect([401, 403]).toContain(error!.status ?? error!.statusCode)
  })
})
describe('GraphQL: query posts', () => {
  it('retorna os posts seedados com autor aninhado', async () => {
    const { data, errors } = await gql('{ posts { slug title badge author { name } } }')
    expect(errors).toBeUndefined()
    const posts = data!.posts as Array<{ slug: string, title: string, badge: string | null, author: { name: string } }>
    expect(posts.length).toBeGreaterThan(0)
    for (const post of posts) {
      // Valida o contrato do schema: campos obrigatórios presentes
      expect(post.slug).toBeTruthy()
      expect(post.title).toBeTruthy()
      expect(post.author.name).toBeTruthy()
    }
  })

  it('valida a query contra o schema (campo inexistente = erro)', async () => {
    // Campo inexistente deve vir como erro de validação do schema,
    // provando que a query passou pelo GraphQL (e não por um echo REST)
    const { errors } = await gql('{ posts { campoQueNaoExiste } }')
    expect(errors).toBeDefined()
    expect(errors![0].message).toContain('Cannot query field')
  })
})

describe('GraphQL: query postBySlug', () => {
  it('retorna um post pelo slug', async () => {
    const { data, errors } = await gql('{ postBySlug(slug: "zen-do-python") { title description author { bio } } }')
    expect(errors).toBeUndefined()
    const post = data!.postBySlug as { title: string, description: string, author: { bio: string } }
    expect(post.title).toBe('Zen do Python')
    expect(post.author.bio).toBeTruthy()
  })

  it('retorna null (não erro) para slug inexistente', async () => {
    const { data, errors } = await gql('{ postBySlug(slug: "slug-inexistente") { title } }')
    expect(errors).toBeUndefined()
    expect(data!.postBySlug).toBeNull()
  })
})
