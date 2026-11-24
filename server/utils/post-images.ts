import { createImageBucket, listBucketImages, saveBucketImage } from './image-bucket'

const postImagesBucket = createImageBucket('posts')

export interface PostImageAsset {
  filename: string
  url: string
}

export async function listPostImages(): Promise<PostImageAsset[]> {
  return await listBucketImages(postImagesBucket)
}

export async function savePostImage(data: Uint8Array) {
  return await saveBucketImage(postImagesBucket, data)
}

export { postImagesBucket }
