import { consumeAuthToken } from '../../utils/auth-tokens'
import { markEmailVerified, updateManagedUserPassword } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body: unknown = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Dados de redefinição inválidos' })
  }

  const input = body as Record<string, unknown>
  const rawToken = typeof input.token === 'string' ? input.token.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''

  if (!rawToken) {
    throw createError({ statusCode: 400, message: 'Informe o token de redefinição' })
  }
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, message: 'A senha deve ter entre 8 e 128 caracteres' })
  }

  const userId = await consumeAuthToken(rawToken, 'password_reset')
  if (userId === null) {
    throw createError({ statusCode: 400, message: 'Este link de redefinição é inválido ou expirou' })
  }

  await updateManagedUserPassword(userId, await hashPassword(password))
  // Quem recebeu o link no e-mail já provou ser dono da caixa de entrada.
  await markEmailVerified(userId)

  return { reset: true }
})
