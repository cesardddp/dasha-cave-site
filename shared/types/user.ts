export type ManagedUserRole = 'admin' | 'commenter'

/** Conta como aparece no painel de administração de usuários. */
export interface ManagedUser {
  id: number
  name: string
  email: string
  avatar: string | null
  role: ManagedUserRole
  createdAt: string
  /** Definido em `runtimeConfig.adminUserIds`: não pode ser rebaixado nem excluído. */
  isConfigAdmin: boolean
}
