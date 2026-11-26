import { consumeAuthToken } from '../../utils/auth-tokens'
import { markEmailVerified } from '../../utils/db'

/**
 * Confirma o e-mail a partir do token enviado por e-mail. Aceita o token no
 * corpo (a página envia) ou na query (links antigos).
 */
export default defineEventHandler(async (event) => {
  const body: unknown = await readBody(event).catch(() => null)
  const fromBody = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>).token
    : undefined
  const fromQuery = getQuery(event).token
  const token = typeof fromBody === 'string'
    ? fromBody.trim()
    : (typeof fromQuery === 'string' ? fromQuery.trim() : '')

  if (!token) {
    throw createError({ statusCode: 400, message: 'Informe o token de confirmação' })
  }

  const userId = await consumeAuthToken(token, 'email_verification')
  if (userId === null) {
    throw createError({ statusCode: 400, message: 'Este link de confirmação é inválido ou expirou' })
  }

  await markEmailVerified(userId)

  return { verified: true }
})
