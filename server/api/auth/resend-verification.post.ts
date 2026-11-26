import { issueAuthToken, isTokenResendThrottled } from '../../utils/auth-tokens'
import { findCredentialsByEmail } from '../../utils/db'
import { sendVerificationEmail } from '../../utils/mail'

/**
 * Reenvia o link de confirmação. A resposta é sempre a mesma para não revelar
 * se o e-mail existe na base.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  setResponseStatus(event, 202)
  const response = { sent: true, message: 'Se este e-mail estiver cadastrado, enviaremos um novo link de confirmação.' }

  if (!email) return response

  const account = await findCredentialsByEmail(email)
  if (!account || account.emailVerifiedAt) return response
  if (await isTokenResendThrottled(account.id, 'email_verification')) return response

  const { token } = await issueAuthToken(account.id, 'email_verification')
  await sendVerificationEmail(event, { name: account.name, email: account.email }, token)

  return response
})
