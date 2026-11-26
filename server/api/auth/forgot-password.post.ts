import { issueAuthToken, isTokenResendThrottled } from '../../utils/auth-tokens'
import { findCredentialsByEmail } from '../../utils/db'
import { sendPasswordResetEmail } from '../../utils/mail'

/**
 * Inicia a recuperação de senha. A resposta é sempre a mesma (202) para não
 * revelar se o e-mail existe na base.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  setResponseStatus(event, 202)
  const response = { sent: true, message: 'Se este e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.' }

  if (!email) return response

  const account = await findCredentialsByEmail(email)
  if (!account) return response
  if (await isTokenResendThrottled(account.id, 'password_reset')) return response

  const { token } = await issueAuthToken(account.id, 'password_reset')
  await sendPasswordResetEmail(event, { name: account.name, email: account.email }, token)

  return response
})
