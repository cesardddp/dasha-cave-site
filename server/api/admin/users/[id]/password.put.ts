import { updateManagedUserPassword } from '../../../../utils/db'
import { requireAdminSession } from '../../../../utils/user-roles'
import { parseUserId } from '../../../../utils/user-management'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = parseUserId(getRouterParam(event, 'id'))

  const body = await readBody<{ password?: string } | null>(event)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'A senha deve ter entre 8 e 128 caracteres' })
  }

  const updated = await updateManagedUserPassword(id, await hashPassword(password))
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Usuário não encontrado' })
  }

  return { id, updated: true }
})
