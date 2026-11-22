import { readUserRole } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) return null

  const role = await readUserRole(event, session.user.id)
  const user = { ...session.user, role }
  await setUserSession(event, { ...session, user })

  return user
})
