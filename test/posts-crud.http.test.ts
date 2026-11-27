import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

// Seam 1: edição e exclusão de post. Testa o comportamento observável por
// HTTP — guarda de sessão, validação do corpo, 404 para slug inexistente e a
// regra de negócio principal: editar não muda o slug publicado.
const databaseDir = mkdtempSync(join(tmpdir(), 'dasha-posts-crud-'))
const databasePath = join(databaseDir, 'blog.sqlite')

await setup({
  server: true,
  setupTimeout: 120_000,
  env: {
    NUXT_DATABASE_PATH: databasePath,
    NUXT_APP_SECRET: 'teste-de-integracao-de-edicao-de-post-1234567890',
    NUXT_ADMIN_USER_IDS: '',
    // Sem SMTP: o cadastro não pode depender do servidor real do `.env`.
    NUXT_SMTP_HOST: '',
  },
})

afterAll(() => {
  rmSync(databaseDir, { recursive: true, force: true })
})

const PASSWORD = 'senha-forte-123'

async function api(
  path: string,
  options: { method?: string, body?: unknown, cookie?: string } = {},
): Promise<{ status: number, data: any, cookie: string }> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (options.body !== undefined)
    headers['content-type'] = 'application/json'
  if (options.cookie)
    headers.cookie = options.cookie

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()

  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  }
  catch {
    data = text
  }

  const sessionCookie = response.headers
    .getSetCookie()
    .map(value => value.split(';')[0])
    .find(value => value.startsWith('nuxt-auth-session='))

  return { status: response.status, data, cookie: sessionCookie ?? '' }
}

function errorMessage(data: unknown): string {
  if (!data || typeof data !== 'object')
    return ''
  const record = data as Record<string, unknown>
  return String(record.message ?? record.message ?? '')
}

/** Confirma o e-mail direto no arquivo SQLite e devolve o id da conta. */
function confirmEmailDirectly(email: string): number {
  const db = new DatabaseSync(databasePath)
  try {
    db.prepare('update users set email_verified_at = ? where email = ?')
      .run(new Date().toISOString(), email)
    const row = db.prepare('select id from users where email = ?').get(email) as { id: number }
    return row.id
  }
  finally {
    db.close()
  }
}

async function createAccount(name: string, email: string) {
  const response = await api('/api/auth/register', {
    method: 'POST',
    body: { name, email, password: PASSWORD },
  })
  expect(response.status).toBe(201)
  expect(response.data.verificationSent).toBe(true)
  expect(response.cookie).toBe('')
  return confirmEmailDirectly(email)
}

function promote(id: number) {
  const db = new DatabaseSync(databasePath)
  try {
    db.prepare('update users set role = ? where id = ?').run('admin', id)
  }
  finally {
    db.close()
  }
}

const VALID_POST = {
  title: 'Post de passagem',
  description: 'Descrição original',
  content: '# Conteúdo original',
  image: null,
  badge: 'Single',
}

describe('edição e exclusão de post: guarda de sessão', () => {
  it('recusa visitantes anônimos com 401', async () => {
    expect((await api('/api/posts/qualquer', { method: 'PUT', body: VALID_POST })).status).toBe(401)
    expect((await api('/api/posts/qualquer', { method: 'DELETE' })).status).toBe(401)
  })
})

describe('edição e exclusão de post: administrador', () => {
  let adminCookie = ''
  let commenterCookie = ''

  it('prepara um administrador e um comentador', async () => {
    const adminId = await createAccount('Ana Admin', 'ana.crud@dashacave.com.br')
    promote(adminId)
    const session = await api<{ role: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: 'ana.crud@dashacave.com.br', password: PASSWORD },
    })
    expect(session.status).toBe(200)
    expect(session.data.role).toBe('admin')
    adminCookie = session.cookie
    expect(adminCookie).toBeTruthy()

    await createAccount('Bruno Comentador', 'bruno.crud@dashacave.com.br')
    const commenter = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'bruno.crud@dashacave.com.br', password: PASSWORD },
    })
    expect(commenter.status).toBe(200)
    commenterCookie = commenter.cookie
    expect(commenterCookie).toBeTruthy()
  })

  it('recusa comentadores com 403', async () => {
    const created = await api<{ slug: string }>('/api/posts', {
      method: 'POST',
      body: VALID_POST,
      cookie: adminCookie,
    })
    expect(created.status).toBe(201)
    const slug = created.data.slug

    const update = await api(`/api/posts/${slug}`, {
      method: 'PUT',
      body: { ...VALID_POST, title: 'Tentativa de comentador' },
      cookie: commenterCookie,
    })
    expect(update.status).toBe(403)

    const removal = await api(`/api/posts/${slug}`, { method: 'DELETE', cookie: commenterCookie })
    expect(removal.status).toBe(403)

    // O post continua intacto depois das tentativas.
    expect((await api(`/api/posts/${slug}`)).status).toBe(200)
  })

  it('edita o post preservando o slug publicado', async () => {
    const created = await api<{ slug: string }>('/api/posts', {
      method: 'POST',
      body: { ...VALID_POST, title: 'Post preservado' },
      cookie: adminCookie,
    })
    expect(created.status).toBe(201)
    const slug = created.data.slug
    expect(slug).toBe('post-preservado')

    const update = await api(`/api/posts/${slug}`, {
      method: 'PUT',
      body: {
        title: 'Título completamente diferente',
        description: 'Descrição revisada',
        content: '# Conteúdo revisado',
        image: '/api/posts/images/abc.webp',
        badge: '',
      },
      cookie: adminCookie,
    })
    expect(update.status).toBe(200)
    expect(update.data.slug).toBe(slug)
    expect(update.data.title).toBe('Título completamente diferente')
    expect(update.data.description).toBe('Descrição revisada')
    expect(update.data.content).toBe('# Conteúdo revisado')
    expect(update.data.image).toBe('/api/posts/images/abc.webp')
    // Badge vazio vira null, como na criação.
    expect(update.data.badge).toBeNull()
    expect(update.data.author.name).toBe('Ana Admin')

    // O endereço antigo continua servindo o post atualizado.
    const fetched = await api(`/api/posts/${slug}`)
    expect(fetched.status).toBe(200)
    expect(fetched.data.title).toBe('Título completamente diferente')

    // E o slug novo (derivado do título) não foi criado.
    expect((await api('/api/posts/titulo-completamente-diferente')).status).toBe(404)

    expect((await api(`/api/posts/${slug}`, { method: 'DELETE', cookie: adminCookie })).status).toBe(200)
  })

  it('responde 400 quando título, descrição ou conteúdo faltam', async () => {
    const created = await api<{ slug: string }>('/api/posts', {
      method: 'POST',
      body: VALID_POST,
      cookie: adminCookie,
    })
    const slug = created.data.slug

    const missing = await api(`/api/posts/${slug}`, {
      method: 'PUT',
      body: { title: 'Só o título', description: '', content: '' },
      cookie: adminCookie,
    })
    expect(missing.status).toBe(400)
    expect(errorMessage(missing.data)).toContain('obrigatórios')

    // A validação roda antes da escrita: o post segue como estava.
    expect((await api(`/api/posts/${slug}`)).data.description).toBe('Descrição original')

    expect((await api(`/api/posts/${slug}`, { method: 'DELETE', cookie: adminCookie })).status).toBe(200)
  })

  it('responde 404 para slug inexistente', async () => {
    const update = await api('/api/posts/post-que-nao-existe', {
      method: 'PUT',
      body: VALID_POST,
      cookie: adminCookie,
    })
    expect(update.status).toBe(404)
    expect(errorMessage(update.data)).toContain('não encontrado')

    const removal = await api('/api/posts/post-que-nao-existe', { method: 'DELETE', cookie: adminCookie })
    expect(removal.status).toBe(404)
    expect(errorMessage(removal.data)).toContain('não encontrado')
  })

  it('apaga o post e ele sai da listagem', async () => {
    const created = await api<{ slug: string }>('/api/posts', {
      method: 'POST',
      body: { ...VALID_POST, title: 'Post descartável' },
      cookie: adminCookie,
    })
    const slug = created.data.slug

    const removal = await api(`/api/posts/${slug}`, { method: 'DELETE', cookie: adminCookie })
    expect(removal.status).toBe(200)
    expect(removal.data).toEqual({ deleted: true })

    expect((await api(`/api/posts/${slug}`)).status).toBe(404)

    const listing = await api<{ slug: string }[]>('/api/posts')
    expect(listing.status).toBe(200)
    expect(listing.data.map(post => post.slug)).not.toContain(slug)

    // Apagar duas vezes é 404, não 500.
    expect((await api(`/api/posts/${slug}`, { method: 'DELETE', cookie: adminCookie })).status).toBe(404)
  })
})
