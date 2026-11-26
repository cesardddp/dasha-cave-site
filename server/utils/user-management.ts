import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { createUserAccount } from './db'

/**
 * IDs de administradores fixados por configuração
 * (`runtimeConfig.adminUserIds`, separados por vírgula).
 */
export function configuredAdminIds(event: H3Event): number[] {
  return String(useRuntimeConfig(event).adminUserIds ?? '')
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isSafeInteger(value) && value > 0)
}

export function parseUserId(raw: string | undefined): number {
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Identificador de usuário inválido' })
  }
  return id
}

/**
 * Cria uma conta com hash de senha; quando não há senha, gera uma aleatória.
 * Devolve a senha usada para que o painel possa mostrá-la ao administrador.
 */
export async function createManagedUser(input: {
  name: string
  email: string
  password?: string
  role?: 'admin' | 'commenter'
}) {
  const password = input.password || randomBytes(9).toString('base64url')
  const passwordHash = await hashPassword(password)
  const account = await createUserAccount({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  })

  return { account, password }
}
