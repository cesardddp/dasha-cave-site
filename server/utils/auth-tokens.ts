import { createHash, randomBytes } from 'node:crypto'
import { useSqlite, withDatabaseTransaction } from './db'

export type AuthTokenPurpose = 'email_verification' | 'password_reset'

/** Validade de cada tipo de token. */
const TOKEN_TTL_MS: Record<AuthTokenPurpose, number> = {
  email_verification: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
}

/** Intervalo mínimo entre dois envios do mesmo tipo de token para o mesmo usuário. */
const RESEND_COOLDOWN_MS = 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface IssuedAuthToken {
  token: string
  expiresAt: string
}

/**
 * Gera um token de uso único para o usuário. O valor em claro só existe aqui:
 * o banco guarda apenas o SHA-256. Tokens anteriores do mesmo tipo são descartados.
 */
export async function issueAuthToken(userId: number, purpose: AuthTokenPurpose): Promise<IssuedAuthToken> {
  const sqlite = await useSqlite()
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS[purpose]).toISOString()

  withDatabaseTransaction(sqlite, () => {
    sqlite.prepare('delete from auth_tokens where user_id = ? and purpose = ?').run(userId, purpose)
    sqlite.prepare(`
      insert into auth_tokens (user_id, purpose, token_hash, expires_at, created_at)
      values (?, ?, ?, ?, ?)
    `).run(userId, purpose, hashToken(token), expiresAt, new Date().toISOString())
  })

  return { token, expiresAt }
}

/**
 * Indica se o último token emitido ainda está dentro da janela de reenvio.
 * Usado para evitar que um usuário (ou um atacante) dispare e-mails em sequência.
 */
export async function isTokenResendThrottled(userId: number, purpose: AuthTokenPurpose): Promise<boolean> {
  const sqlite = await useSqlite()
  const row = sqlite.prepare(`
    select created_at as createdAt from auth_tokens
    where user_id = ? and purpose = ?
  `).get(userId, purpose) as { createdAt: string } | undefined

  if (!row) return false

  const createdAt = Date.parse(row.createdAt)
  if (Number.isNaN(createdAt)) return false

  return Date.now() - createdAt < RESEND_COOLDOWN_MS
}

/**
 * Consome o token (se válido) e devolve o id do usuário. O token é apagado
 * em qualquer caso, então um link só funciona uma vez.
 */
export async function consumeAuthToken(token: string, purpose: AuthTokenPurpose): Promise<number | null> {
  if (!token) return null

  const sqlite = await useSqlite()
  const tokenHash = hashToken(token)

  const row = sqlite.prepare(`
    select id, user_id as userId, expires_at as expiresAt from auth_tokens
    where token_hash = ? and purpose = ?
  `).get(tokenHash, purpose) as { id: number, userId: number, expiresAt: string } | undefined

  if (!row) return null

  sqlite.prepare('delete from auth_tokens where id = ?').run(row.id)

  const expiresAt = Date.parse(row.expiresAt)
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) return null

  return row.userId
}
