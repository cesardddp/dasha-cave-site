import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

// Seam 2: reordenação manual dos livros. Testa o comportamento observável por
// HTTP — guarda de sessão, validação da direção, 404 para slug inexistente e a
// regra de negócio principal: mover troca o livro de posição no `GET /api/books`.
const databaseDir = mkdtempSync(join(tmpdir(), 'dasha-books-reorder-'))
const databasePath = join(databaseDir, 'blog.sqlite')
const booksDatabasePath = join(databaseDir, 'books.sqlite')

await setup({
  server: true,
  setupTimeout: 120_000,
  env: {
    NUXT_DATABASE_PATH: databasePath,
    NUXT_BOOKS_DATABASE_PATH: booksDatabasePath,
    NUXT_APP_SECRET: 'teste-de-integracao-de-reordenacao-de-livros-1234567890',
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

function promote(id: number) {
  const db = new DatabaseSync(databasePath)
  try {
    db.prepare('update users set role = ? where id = ?').run('admin', id)
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
  expect(response.cookie).toBe('')
  return confirmEmailDirectly(email)
}

async function slugs(): Promise<string[]> {
  const response = await api('/api/books')
  expect(response.status).toBe(200)
  return response.data.map((book: { slug: string }) => book.slug)
}

describe('reordenação de livros: guarda de sessão', () => {
  it('recusa visitantes anônimos com 401', async () => {
    const response = await api('/api/books/la-calamita/move', {
      method: 'PUT',
      body: { direction: 'up' },
    })
    expect(response.status).toBe(401)
  })

  it('recusa comentadores com 403', async () => {
    await createAccount('Bruno Leitor', 'bruno.reorder@dashacave.com.br')
    const session = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'bruno.reorder@dashacave.com.br', password: PASSWORD },
    })
    expect(session.status).toBe(200)
    expect(session.data.role).toBe('commenter')

    const response = await api('/api/books/la-calamita/move', {
      method: 'PUT',
      body: { direction: 'up' },
      cookie: session.cookie,
    })
    expect(response.status).toBe(403)
  })
})

describe('reordenação de livros: administrador', () => {
  let adminCookie = ''

  it('prepara um administrador', async () => {
    const id = await createAccount('Ana Admin', 'ana.reorder@dashacave.com.br')
    promote(id)

    const session = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'ana.reorder@dashacave.com.br', password: PASSWORD },
    })
    expect(session.status).toBe(200)
    expect(session.data.role).toBe('admin')
    adminCookie = session.cookie
    expect(adminCookie).toBeTruthy()
  })

  it('responde 404 para livro inexistente', async () => {
    const response = await api('/api/books/livro-fantasma/move', {
      method: 'PUT',
      body: { direction: 'up' },
      cookie: adminCookie,
    })
    expect(response.status).toBe(404)
  })

  it('responde 422 para direção inválida', async () => {
    const response = await api('/api/books/la-calamita/move', {
      method: 'PUT',
      body: { direction: 'lado' },
      cookie: adminCookie,
    })
    expect(response.status).toBe(422)
  })

  it('sobe o livro uma posição e devolve a lista reordenada', async () => {
    const before = await slugs()
    const index = before.indexOf('la-calamita')
    expect(index).toBeGreaterThan(0)

    const response = await api('/api/books/la-calamita/move', {
      method: 'PUT',
      body: { direction: 'up' },
      cookie: adminCookie,
    })
    expect(response.status).toBe(200)
    expect(response.data.map((book: { slug: string }) => book.slug)).toEqual(
      await slugs(),
    )

    const after = await slugs()
    expect(after[index - 1]).toBe('la-calamita')
    expect(after[index]).toBe(before[index - 1])
    expect(after).toHaveLength(before.length)
  })

  it('desce o livro de volta para a posição original', async () => {
    const before = await slugs()
    const index = before.indexOf('la-calamita')

    const response = await api('/api/books/la-calamita/move', {
      method: 'PUT',
      body: { direction: 'down' },
      cookie: adminCookie,
    })
    expect(response.status).toBe(200)

    const after = await slugs()
    expect(after[index + 1]).toBe('la-calamita')
    expect(after[index]).toBe(before[index + 1])
  })

  it('mantém a ordem estável nas extremidades', async () => {
    const before = await slugs()

    const first = await api(`/api/books/${before[0]}/move`, {
      method: 'PUT',
      body: { direction: 'up' },
      cookie: adminCookie,
    })
    expect(first.status).toBe(200)
    expect(await slugs()).toEqual(before)

    const last = await api(`/api/books/${before[before.length - 1]}/move`, {
      method: 'PUT',
      body: { direction: 'down' },
      cookie: adminCookie,
    })
    expect(last.status).toBe(200)
    expect(await slugs()).toEqual(before)
  })
})
