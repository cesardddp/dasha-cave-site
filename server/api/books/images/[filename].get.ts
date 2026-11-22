import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { send } from 'h3'

const imageTypes = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename') ?? ''
  const match = filename.match(/^([0-9a-f-]{36})\.(jpg|png|webp)$/i)

  if (!match) {
    throw createError({ statusCode: 404, statusMessage: 'Imagem não encontrada' })
  }

  const filePath = join(process.cwd(), 'public', 'uploads', 'books', filename)
  let data: Buffer
  try {
    data = await readFile(filePath)
  }
  catch (cause) {
    if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
      throw createError({ statusCode: 404, statusMessage: 'Imagem não encontrada' })
    }
    throw cause
  }

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return send(event, data, imageTypes[match[2].toLowerCase() as keyof typeof imageTypes])
})
