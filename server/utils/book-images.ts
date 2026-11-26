import { createImageBucket, listBucketImages, saveBucketImage } from './image-bucket'

const bookImagesBucket = createImageBucket('books')

export interface BookImageAsset {
  filename: string
  url: string
}

export async function listBookImages(): Promise<BookImageAsset[]> {
  return await listBucketImages(bookImagesBucket)
}

export async function saveBookImage(data: Uint8Array) {
  return await saveBucketImage(bookImagesBucket, data)
}

export async function readLimitedResponse(response: Response, maximumSize: number) {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maximumSize) {
    throw createError({ statusCode: 413, message: 'A resposta da Amazon excedeu o limite permitido' })
  }

  if (!response.body) {
    throw createError({ statusCode: 502, message: 'A resposta da Amazon veio vazia' })
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
      throw createError({ statusCode: 413, message: 'A resposta da Amazon excedeu o limite permitido' })
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
