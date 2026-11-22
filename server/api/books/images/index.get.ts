import { listBookImages } from '../../../utils/book-images'
import { requireAdminSession } from '../../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  return await listBookImages()
})
