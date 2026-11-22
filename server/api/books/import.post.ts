import { importAmazonBook } from '../../utils/amazon-book-import'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const body = await readBody<{ amazonUrl?: string }>(event)
  return await importAmazonBook(body?.amazonUrl)
})
