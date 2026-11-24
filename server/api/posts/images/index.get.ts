import { listPostImages } from '../../../utils/post-images'
import { requireAdminSession } from '../../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  return await listPostImages()
})
