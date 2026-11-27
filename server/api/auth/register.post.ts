import { issueAuthToken } from '../../utils/auth-tokens'
import { createUserAccount } from '../../utils/db'
import { sendVerificationEmail } from '../../utils/mail'

function uniqueEmailError(cause: unknown): cause is Error & { errcode: number } {
  return cause instanceof Error
    && 'errcode' in cause
    && cause.errcode === 2067
}

export default defineEventHandler(async (event) => {
  const body: unknown = await readBody(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Dados de cadastro inválidos' })
  }

  const input = body as Record<string, unknown>
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''

  if (name.length < 2 || name.length > 100) {
    throw createError({ statusCode: 400, message: 'O nome deve ter entre 2 e 100 caracteres' })
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Informe um e-mail válido' })
  }
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, message: 'A senha deve ter entre 8 e 128 caracteres' })
  }

  const passwordHash = await hashPassword(password)
  let account
  try {
    account = await createUserAccount({ name, email, passwordHash })
  }
  catch (cause) {
    if (uniqueEmailError(cause)) {
      throw createError({ statusCode: 409, message: 'Já existe uma conta com este e-mail' })
    }
    throw cause
  }

  const { token } = await issueAuthToken(account.id, 'email_verification')

  try {
    await sendVerificationEmail(event, { name: account.name, email: account.email }, token)
  }
  catch (cause) {
    // A conta já existe e ficou sem confirmação; o usuário pode reenviar depois.
    console.error(`[mail] cadastro de ${account.email} criado, mas a confirmação não foi enviada:`, cause)
    throw cause
  }

  setResponseStatus(event, 201)
  return { email: account.email, verificationSent: true }
})
