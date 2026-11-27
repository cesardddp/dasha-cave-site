import { desc } from 'drizzle-orm'
import { users } from '../../../database/schema'
import { requireAdminSession } from '../../../utils/user-roles'
import { configuredAdminIds } from '../../../utils/user-management'
import type { ManagedUser } from '../../../../shared/types/user'

export default defineEventHandler(async (event): Promise<ManagedUser[]> => {
  await requireAdminSession(event)
  const adminIds = configuredAdminIds(event)

  const db = await useDatabase()
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return rows.map(row => ({
    ...row,
    role: adminIds.includes(row.id) ? 'admin' : row.role,
    isConfigAdmin: adminIds.includes(row.id),
  }))
})
