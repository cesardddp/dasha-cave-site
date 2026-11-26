import { sendRedirect } from 'nuxt/server'
import type { GoogleAccountProfile } from '../../utils/db'
import { getOrCreateGoogleAccount } from '../../utils/db'
import { readUserRole } from '../../utils/user-roles'

function googleAccountProfile(value: unknown): GoogleAccountProfile {
  if (!value || typeof value !== 'object') {
    throw createError({ statusCode: 401, message: 'O Google não retornou um perfil válido' })
  }

  const profile = value as Record<string, unknown>
  const id = typeof profile.sub === 'string' ? profile.sub : ''
  const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : ''

  if (!id || !email || profile.email_verified !== true) {
    throw createError({
      statusCode: 403,
      message: 'Use uma conta Google com e-mail verificado',
    })
  }

  const providedName = typeof profile.name === 'string' ? profile.name.trim() : ''
  const name = providedName || email.split('@')[0]
  const picture = typeof profile.picture === 'string' ? profile.picture : ''
  let avatar: string | null = null

  try {
    const url = new URL(picture)
    if (url.protocol === 'https:') {
      avatar = url.toString()
    }
  }
  catch {
    avatar = null
  }

  return { id, email, name, avatar }
}

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const profile = googleAccountProfile(user)
    const account = await getOrCreateGoogleAccount(profile)
    const role = await readUserRole(event, account.id)

    await setUserSession(event, {
      user: { ...account, role },
      loggedInAt: new Date().toISOString(),
    })

    return sendRedirect(event, '/blog')
  },
  onError(event) {
    return sendRedirect(event, '/login?error=google')
  },
})
