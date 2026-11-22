import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const maximumImageSize = 5 * 1024 * 1024
const bookImagesDirectory = join(process.cwd(), 'public', 'uploads', 'books')
const bookImageFilenamePattern = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i

export interface BookImageAsset {
  filename: string
  url: string
}

export async function listBookImages(): Promise<BookImageAsset[]> {
  await mkdir(bookImagesDirectory, { recursive: true })
  const entries = await readdir(bookImagesDirectory, { withFileTypes: true })

  return entries
    .filter(entry => entry.isFile() && bookImageFilenamePattern.test(entry.name))
    .map(entry => ({
      filename: entry.name,
      url: `/api/books/images/${entry.name}`,
    }))
    .sort((first, second) => first.filename.localeCompare(second.filename))
}

function imageExtension(data: Uint8Array) {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    return 'jpg'
  if (
    data[0] === 0x89
    && data[1] === 0x50
    && data[2] === 0x4e
    && data[3] === 0x47
    && data[4] === 0x0d
    && data[5] === 0x0a
    && data[6] === 0x1a
    && data[7] === 0x0a
  ) {
    return 'png'
  }
  if (
    String.fromCharCode(...data.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...data.slice(8, 12)) === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

export async function saveBookImage(data: Uint8Array) {
  if (data.byteLength === 0 || data.byteLength > maximumImageSize) {
    throw createError({ statusCode: 413, statusMessage: 'A imagem deve ter até 5 MB' })
  }

  const extension = imageExtension(data)
  if (!extension) {
    throw createError({ statusCode: 415, statusMessage: 'Envie uma imagem JPEG, PNG ou WebP válida' })
  }

  const filename = `${randomUUID()}.${extension}`
  await mkdir(bookImagesDirectory, { recursive: true })
  await writeFile(join(bookImagesDirectory, filename), data, { flag: 'wx' })
  return `/api/books/images/${filename}`
}

export async function readLimitedResponse(response: Response, maximumSize: number) {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maximumSize) {
    throw createError({ statusCode: 413, statusMessage: 'A resposta da Amazon excedeu o limite permitido' })
  }

  if (!response.body) {
    throw createError({ statusCode: 502, statusMessage: 'A resposta da Amazon veio vazia' })
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maximumSize) {
      await reader.cancel()
      throw createError({ statusCode: 413, statusMessage: 'A resposta da Amazon excedeu o limite permitido' })
    }
    chunks.push(value)
  }

  const data = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    data.set(chunk, offset)
    offset += chunk.byteLength
  }
  return data
}
