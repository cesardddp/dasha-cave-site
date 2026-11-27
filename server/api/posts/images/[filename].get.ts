import { sendBucketImage } from '../../../utils/image-bucket'
import { postImagesBucket } from '../../../utils/post-images'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename') ?? ''
  return await sendBucketImage(event, postImagesBucket, filename)
})
