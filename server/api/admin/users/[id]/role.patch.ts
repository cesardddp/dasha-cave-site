import { updateManagedUserRole } from '../../../../utils/db'
import { requireAdminSession } from '../../../../utils/user-roles'
import { configuredAdminIds, parseUserId } from '../../../../utils/user-management'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = parseUserId(getRouterParam(event, 'id'))

  const body = await readBody<{ role?: string } | null>(event)
  if (body?.role !== 'admin' && body?.role !== 'commenter') {
    throw createError({ statusCode: 400, message: 'Perfil inválido: use admin ou commenter' })
  }

  const result = await updateManagedUserRole(id, body.role, configuredAdminIds(event))
  switch (result) {
    case 'updated':
      return { id, role: body.role }
    case 'not-found':
      throw createError({ statusCode: 404, message: 'Usuário não encontrado' })
    case 'config-admin':
      throw createError({
        statusCode: 409,
        message: 'Este administrador é definido pela configuração do servidor e não pode ser rebaixado',
      })
    case 'last-admin':
      throw createError({ statusCode: 409, message: 'O site precisa de pelo menos um administrador' })
  }
})
