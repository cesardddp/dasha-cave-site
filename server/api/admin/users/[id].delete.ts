import { deleteManagedUser } from '../../../utils/db'
import { requireAdminSession } from '../../../utils/user-roles'
import { configuredAdminIds, parseUserId } from '../../../utils/user-management'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = parseUserId(getRouterParam(event, 'id'))

  const result = await deleteManagedUser(id, configuredAdminIds(event))
  switch (result) {
    case 'deleted':
      return { id, deleted: true }
    case 'not-found':
      throw createError({ statusCode: 404, message: 'Usuário não encontrado' })
    case 'config-admin':
      throw createError({
        statusCode: 409,
        message: 'Este administrador é definido pela configuração do servidor e não pode ser excluído',
      })
    case 'last-admin':
      throw createError({ statusCode: 409, message: 'O site precisa de pelo menos um administrador' })
  }
})
