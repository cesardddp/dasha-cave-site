import { createImageBucket, sendBucketImage } from '../../../utils/image-bucket'

const bookImagesBucket = createImageBucket('books')

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename') ?? ''
  return await sendBucketImage(event, bookImagesBucket, filename)
})
