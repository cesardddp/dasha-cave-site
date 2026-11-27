import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { users } from '../database/schema'

export type UserRole = 'admin' | 'commenter'

export function roleForUserId(event: H3Event, id: number): UserRole {
  const adminUserIds = String(useRuntimeConfig(event).adminUserIds ?? '')
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isSafeInteger(value) && value > 0)

  return adminUserIds.includes(id) ? 'admin' : 'commenter'
}

export async function readUserRole(event: H3Event, id: number): Promise<UserRole> {
  const db = await useDatabase()
  const [account] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!account) {
    throw createError({ statusCode: 401, message: 'A conta desta sessão não existe mais' })
  }

  return roleForUserId(event, id) === 'admin' ? 'admin' : account.role
}

export async function requireAdminSession(event: H3Event) {
  const { user } = await requireUserSession(event)
  const role = await readUserRole(event, user.id)

  if (role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Esta ação é permitida apenas para administradores' })
  }

  return { ...user, role }
}
