import { existsSync, mkdtempSync, rmSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

// Seam 1: imagens de post. Testa o comportamento observável por HTTP —
// guarda de sessão, validação por magic bytes, listagem do bucket e entrega
// do arquivo — contra um servidor Nuxt real e um banco temporário.
const databaseDir = mkdtempSync(join(tmpdir(), 'dasha-post-images-'))
const databasePath = join(databaseDir, 'blog.sqlite')
const uploadsDir = join(process.cwd(), 'public', 'uploads', 'posts')
const createdFiles: string[] = []

await setup({
  server: true,
  setupTimeout: 120_000,
  env: {
    NUXT_DATABASE_PATH: databasePath,
    NUXT_APP_SECRET: 'teste-de-integracao-das-imagens-de-post-1234567890',
    NUXT_ADMIN_USER_IDS: '',
    // Sem SMTP: o cadastro não pode depender do servidor real do `.env`.
    NUXT_SMTP_HOST: '',
  },
})

afterAll(() => {
  for (const file of createdFiles) {
    if (existsSync(file))
      unlinkSync(file)
  }
  rmSync(databaseDir, { recursive: true, force: true })
})

const PASSWORD = 'senha-forte-123'

// Assinatura PNG seguida de bytes arbitrários: suficiente para a validação
// por magic bytes do bucket.
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00])

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

async function upload(bytes: Uint8Array, filename = 'foto.png', cookie = '') {
  const body = new FormData()
  body.append('image', new Blob([bytes], { type: 'image/png' }), filename)
  const response = await fetch('/api/posts/image', {
    method: 'POST',
    headers: cookie ? { cookie } : {},
    body,
  })
  const text = await response.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  }
  catch {
    data = text
  }
  return { status: response.status, data }
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

describe('imagens de post: guarda de sessão', () => {
  it('recusa visitantes anônimos com 401', async () => {
    expect((await api('/api/posts/images')).status).toBe(401)
    expect((await upload(PNG_BYTES)).status).toBe(401)
  })
})

describe('imagens de post: bucket do administrador', () => {
  let adminCookie = ''
  let commenterCookie = ''

  it('prepara um administrador e um comentador', async () => {
    const adminId = await createAccount('Ana Admin', 'ana.imagens@dashacave.com.br')
    promote(adminId)
    const session = await api<{ role: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: 'ana.imagens@dashacave.com.br', password: PASSWORD },
    })
    expect(session.status).toBe(200)
    expect(session.data.role).toBe('admin')
    adminCookie = session.cookie
    expect(adminCookie).toBeTruthy()

    await createAccount('Bruno Comentador', 'bruno.imagens@dashacave.com.br')
    const commenter = await api('/api/auth/login', {
      method: 'POST',
      body: { email: 'bruno.imagens@dashacave.com.br', password: PASSWORD },
    })
    expect(commenter.status).toBe(200)
    commenterCookie = commenter.cookie
    expect(commenterCookie).toBeTruthy()
  })

  it('recusa comentadores com 403', async () => {
    const list = await api('/api/posts/images', { cookie: commenterCookie })
    expect(list.status).toBe(403)

    const uploadResponse = await upload(PNG_BYTES, 'foto.png', commenterCookie)
    expect(uploadResponse.status).toBe(403)
  })

  it('faz upload, lista no bucket e serve o arquivo', async () => {
    const uploaded = await upload(PNG_BYTES, 'foto.png', adminCookie)
    expect(uploaded.status).toBe(200)

    const url = String(uploaded.data.image)
    expect(url).toMatch(/^\/api\/posts\/images\/[0-9a-f-]{36}\.png$/)
    createdFiles.push(join(uploadsDir, url.split('/').pop()!))

    const listing = await api<{ filename: string, url: string }[]>('/api/posts/images', { cookie: adminCookie })
    expect(listing.status).toBe(200)
    expect(listing.data.map(asset => asset.url)).toContain(url)

    const file = await fetch(url)
    expect(file.status).toBe(200)
    expect(file.headers.get('content-type')).toContain('image/png')
    expect(file.headers.get('cache-control')).toContain('immutable')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(PNG_BYTES)
  })

  it('rejeita corpo sem imagem e formato não suportado', async () => {
    const empty = await fetch('/api/posts/image', {
      method: 'POST',
      headers: { cookie: adminCookie },
      body: new FormData(),
    })
    expect(empty.status).toBe(400)

    const invalid = await upload(new TextEncoder().encode('isto não é uma imagem'), 'nota.png', adminCookie)
    expect(invalid.status).toBe(415)
    expect(errorMessage(invalid.data)).toContain('JPEG, PNG ou WebP')
  })

  it('responde 404 para nomes fora do padrão', async () => {
    expect((await fetch('/api/posts/images/../../blog.sqlite')).status).toBe(404)
    expect((await fetch('/api/posts/images/inexistente.png')).status).toBe(404)
  })
})
