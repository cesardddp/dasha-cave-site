import { readMultipartFormData } from 'h3'
import { saveBookImage } from '../../utils/book-images'
import { requireAdminSession } from '../../utils/user-roles'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const contentLength = Number(getHeader(event, 'content-length'))
  if (Number.isFinite(contentLength) && contentLength > 6 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'A imagem deve ter até 5 MB' })
  }

  const files = await readMultipartFormData(event)
  const image = files?.find(file => file.name === 'image' && file.data.length > 0)

  if (!image) {
    throw createError({ statusCode: 400, statusMessage: 'Selecione uma imagem para enviar' })
  }

  return { image: await saveBookImage(image.data) }
})
