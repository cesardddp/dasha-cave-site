import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { send } from 'h3'

export const maximumImageSize = 5 * 1024 * 1024

const imageFilenamePattern = /^([0-9a-f-]{36})\.(jpg|png|webp)$/i

const imageTypes = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const

export interface ImageAsset {
  filename: string
  url: string
}

export interface ImageBucket {
  /** Pasta no disco onde os arquivos ficam (public/uploads/<nome>). */
  directory: string
  /** Prefixo público usado nas URLs devolvidas. */
  urlPrefix: string
}

export function createImageBucket(name: string): ImageBucket {
  return {
    directory: join(process.cwd(), 'public', 'uploads', name),
    urlPrefix: `/api/${name}/images`,
  }
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

export async function listBucketImages(bucket: ImageBucket): Promise<ImageAsset[]> {
  await mkdir(bucket.directory, { recursive: true })
  const entries = await readdir(bucket.directory, { withFileTypes: true })

  return entries
    .filter(entry => entry.isFile() && imageFilenamePattern.test(entry.name))
    .map(entry => ({
      filename: entry.name,
      url: `${bucket.urlPrefix}/${entry.name}`,
    }))
    .sort((first, second) => first.filename.localeCompare(second.filename))
}

export async function saveBucketImage(bucket: ImageBucket, data: Uint8Array) {
  if (data.byteLength === 0 || data.byteLength > maximumImageSize) {
    throw createError({ statusCode: 413, message: 'A imagem deve ter até 5 MB' })
  }

  const extension = imageExtension(data)
  if (!extension) {
    throw createError({ statusCode: 415, message: 'Envie uma imagem JPEG, PNG ou WebP válida' })
  }

  const filename = `${randomUUID()}.${extension}`
  await mkdir(bucket.directory, { recursive: true })
  await writeFile(join(bucket.directory, filename), data, { flag: 'wx' })
  return `${bucket.urlPrefix}/${filename}`
}

export async function sendBucketImage(
  event: Parameters<typeof send>[0],
  bucket: ImageBucket,
  filename: string,
) {
  const match = filename.match(imageFilenamePattern)

  if (!match) {
    throw createError({ statusCode: 404, message: 'Imagem não encontrada' })
  }

  let data: Buffer
  try {
    data = await readFile(join(bucket.directory, filename))
  }
  catch (cause) {
    if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
      throw createError({ statusCode: 404, message: 'Imagem não encontrada' })
    }
    throw cause
  }

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return send(event, data, imageTypes[match[2]!.toLowerCase() as keyof typeof imageTypes])
}
