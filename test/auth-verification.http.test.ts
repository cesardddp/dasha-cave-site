import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

// Seam: confirmação de e-mail e recuperação de senha. O servidor de e-mail é um
// relay HTTP falso local, então o teste enxerga exatamente o que o app enviaria
// e consegue recuperar o token do link.
interface CapturedMail {
  from: string
  to: string
  subject: string
  html: string
  text: string
}

const outbox: CapturedMail[] = []

const mailServer = createServer((request, response) => {
  const chunks: Buffer[] = []
  request.on('data', chunk => chunks.push(chunk as Buffer))
  request.on('end', () => {
    try {
      outbox.push(JSON.parse(Buffer.concat(chunks).toString('utf8')) as CapturedMail)
    }
    catch {
      outbox.push({ from: '', to: '', subject: '', html: '', text: '' })
    }
    response.writeHead(202, { 'content-type': 'application/json' })
    response.end('{"queued":true}')
  })
})

await new Promise<void>(resolve => mailServer.listen(0, '127.0.0.1', resolve))
const mailEndpoint = `http://127.0.0.1:${(mailServer.address() as AddressInfo).port}/enviar`

const databaseDir = mkdtempSync(join(tmpdir(), 'dasha-auth-mail-'))
const databasePath = join(databaseDir, 'blog.sqlite')

await setup({
  server: true,
  setupTimeout: 120_000,
  env: {
    NUXT_DATABASE_PATH: databasePath,
    NUXT_APP_SECRET: 'teste-de-integracao-da-verificacao-de-email-1234567890',
    NUXT_ADMIN_USER_IDS: '',
    NUXT_MAIL_ENDPOINT: mailEndpoint,
    NUXT_MAIL_FROM: 'Caverna da Dasha <nao-responda@dashacave.test>',
    NUXT_PUBLIC_SITE_URL: 'https://dashacave.test',
  },
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    mailServer.close(error => error ? reject(error) : resolve())
  })
  rmSync(databaseDir, { recursive: true, force: true })
})

interface ApiResponse<T = any> {
  status: number
  data: T
  cookie: string
}

const PASSWORD = 'senha-forte-123'

async function api<T = any>(
  path: string,
  options: { method?: string, body?: unknown, cookie?: string } = {},
): Promise<ApiResponse<T>> {
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

function mailsTo(email: string): CapturedMail[] {
  return outbox.filter(mail => mail.to === email)
}

function tokenFrom(mail: CapturedMail, path: string): string {
  const match = mail.text.match(new RegExp(`${path}\\?token=([\\w-]+)`))
  if (!match?.[1])
    throw new Error(`Token ausente no e-mail enviado para ${mail.to}`)
  return match[1]
}

async function register(name: string, email: string) {
  return await api<{ email: string, verificationSent: boolean }>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password: PASSWORD },
  })
}

async function login(email: string, password = PASSWORD) {
  return await api<{ id: number, role: string }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

describe('cadastro e confirmação de e-mail', () => {
  const email = 'helena@dashacave.test'
  let verificationToken = ''

  it('cadastra sem abrir sessão e envia o link de confirmação', async () => {
    const created = await register('Helena Nova', email)

    expect(created.status).toBe(201)
    expect(created.data).toEqual({ email, verificationSent: true })
    expect(created.cookie).toBe('')

    const mails = mailsTo(email)
    expect(mails).toHaveLength(1)
    expect(mails[0]!.from).toContain('nao-responda@dashacave.test')
    expect(mails[0]!.subject).toContain('Confirme seu e-mail')
    expect(mails[0]!.html).toContain('Helena Nova')
    expect(mails[0]!.text).toContain('https://dashacave.test/verificar?token=')

    verificationToken = tokenFrom(mails[0]!, 'https://dashacave.test/verificar')
  })

  it('recusa o login enquanto o e-mail não foi confirmado', async () => {
    const response = await login(email)

    expect(response.status).toBe(403)
    expect(response.data.data.code).toBe('email_not_verified')
  })

  it('não reenvia dentro do intervalo mínimo', async () => {
    const before = mailsTo(email).length
    const response = await api<{ sent: boolean }>('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    })

    expect(response.status).toBe(202)
    expect(response.data.sent).toBe(true)
    expect(mailsTo(email)).toHaveLength(before)
  })

  it('recusa token inválido com 400', async () => {
    const response = await api('/api/auth/verify', { method: 'POST', body: { token: 'token-inventado' } })

    expect(response.status).toBe(400)
  })

  it('confirma o e-mail e libera o login', async () => {
    const verified = await api<{ verified: boolean }>('/api/auth/verify', {
      method: 'POST',
      body: { token: verificationToken },
    })
    expect(verified.status).toBe(200)
    expect(verified.data.verified).toBe(true)

    const session = await login(email)
    expect(session.status).toBe(200)
    expect(session.data.role).toBe('commenter')
    expect(session.cookie).toBeTruthy()
  })

  it('não aceita o mesmo token duas vezes', async () => {
    const reused = await api('/api/auth/verify', { method: 'POST', body: { token: verificationToken } })

    expect(reused.status).toBe(400)
  })

  it('não reenvia confirmação para conta já verificada', async () => {
    const before = mailsTo(email).length
    const response = await api('/api/auth/resend-verification', { method: 'POST', body: { email } })

    expect(response.status).toBe(202)
    expect(mailsTo(email)).toHaveLength(before)
  })

  it('responde igual para e-mail desconhecido', async () => {
    const response = await api<{ sent: boolean }>('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: 'ninguem@dashacave.test' },
    })

    expect(response.status).toBe(202)
    expect(response.data.sent).toBe(true)
    expect(mailsTo('ninguem@dashacave.test')).toHaveLength(0)
  })
})

describe('recuperação de senha', () => {
  const email = 'otavio@dashacave.test'
  const newPassword = 'outra-senha-456'
  let resetToken = ''

  it('envia o link de redefinição para uma conta existente', async () => {
    const created = await register('Otávio Antigo', email)
    expect(created.status).toBe(201)

    const response = await api<{ sent: boolean }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
    expect(response.status).toBe(202)
    expect(response.data.sent).toBe(true)

    const resetMails = mailsTo(email).filter(mail => mail.subject.includes('Redefinir sua senha'))
    expect(resetMails).toHaveLength(1)
    expect(resetMails[0]!.text).toContain('https://dashacave.test/redefinir-senha?token=')

    resetToken = tokenFrom(resetMails[0]!, 'https://dashacave.test/redefinir-senha')
  })

  it('responde igual para e-mail desconhecido', async () => {
    const response = await api<{ sent: boolean }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'ninguem@dashacave.test' },
    })

    expect(response.status).toBe(202)
    expect(response.data.sent).toBe(true)
    expect(mailsTo('ninguem@dashacave.test')).toHaveLength(0)
  })

  it('valida o tamanho da nova senha', async () => {
    const response = await api('/api/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: '123' },
    })

    expect(response.status).toBe(400)
  })

  it('troca a senha e já deixa o e-mail confirmado', async () => {
    const reset = await api<{ reset: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: newPassword },
    })
    expect(reset.status).toBe(200)
    expect(reset.data.reset).toBe(true)

    expect((await login(email)).status).toBe(401)
    const session = await login(email, newPassword)
    expect(session.status).toBe(200)
  })

  it('não aceita o mesmo token de redefinição duas vezes', async () => {
    const reused = await api('/api/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: 'mais-uma-senha-789' },
    })

    expect(reused.status).toBe(400)
  })
})
