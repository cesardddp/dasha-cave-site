import { requireAdminSession } from '../../../utils/user-roles'
import { createManagedUser } from '../../../utils/user-management'

function isUniqueEmailViolation(cause: unknown) {
  return cause instanceof Error && 'errcode' in cause && cause.errcode === 2067
}

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const body = await readBody<Record<string, unknown> | null>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const role = body?.role === 'admin' ? 'admin' : 'commenter'

  if (name.length < 2 || name.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'O nome deve ter entre 2 e 100 caracteres' })
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail válido' })
  }
  if (password && (password.length < 8 || password.length > 128)) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter entre 8 e 128 caracteres' })
  }

  try {
    const { account, password: usedPassword } = await createManagedUser({ name, email, password, role })

    setResponseStatus(event, 201)
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      role,
      // Só devolve a senha quando ela foi gerada pelo servidor.
      generatedPassword: password ? undefined : usedPassword,
    }
  }
  catch (cause) {
    if (isUniqueEmailViolation(cause)) {
      throw createError({ statusCode: 409, statusMessage: 'Já existe uma conta com este e-mail' })
    }
    throw cause
  }
})
