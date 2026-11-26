import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'
import { readUserRole } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password ?? ''

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'E-mail e senha são obrigatórios' })
  }

  const db = await useDatabase()
  const [account] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!account || !(await verifyPassword(account.passwordHash, password))) {
    throw createError({ statusCode: 401, message: 'E-mail ou senha inválidos' })
  }

  if (!account.emailVerifiedAt) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Confirme seu e-mail antes de entrar',
      data: { code: 'email_not_verified' },
    })
  }

  const role = await readUserRole(event, account.id)
  const user = {
    id: account.id,
    name: account.name,
    email: account.email,
    avatar: account.avatar,
    role,
  }

  await setUserSession(event, {
    user,
    loggedInAt: new Date().toISOString(),
  })

  return user
})
