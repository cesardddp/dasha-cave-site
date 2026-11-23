import sharp from 'sharp'

interface ColorBucket {
  red: number
  green: number
  blue: number
  saturation: number
  count: number
}

export interface ImagePalette {
  accent: string
  secondaryAccent: string
}

function colorDistance(first: ColorBucket, second: ColorBucket) {
  return Math.hypot(
    first.red - second.red,
    first.green - second.green,
    first.blue - second.blue,
  )
}

function colorHex(color: ColorBucket) {
  return `#${[color.red, color.green, color.blue]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`
}

function bucketScore(color: ColorBucket) {
  return color.count * (0.6 + color.saturation * 1.6)
}

export async function extractImagePalette(image: Uint8Array): Promise<ImagePalette> {
  const { data, info } = await sharp(Buffer.from(image))
    .rotate()
    .flatten({ background: '#181818' })
    .resize({ width: 48, height: 64, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.channels !== 3 || data.length < 3) {
    throw new Error('A imagem não contém pixels RGB para analisar')
  }

  const allBuckets = new Map<string, ColorBucket>()
  const colorfulBuckets = new Map<string, ColorBucket>()

  for (let offset = 0; offset + 2 < data.length; offset += info.channels) {
    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    const maximum = Math.max(red, green, blue)
    const minimum = Math.min(red, green, blue)
    const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum
    const luminance = (red * 0.2126) + (green * 0.7152) + (blue * 0.0722)
    const key = `${red >> 4}-${green >> 4}-${blue >> 4}`

    const allBucket = allBuckets.get(key) ?? { red: 0, green: 0, blue: 0, saturation: 0, count: 0 }
    allBucket.red += red
    allBucket.green += green
    allBucket.blue += blue
    allBucket.saturation += saturation
    allBucket.count++
    allBuckets.set(key, allBucket)

    if (saturation >= 0.12 && luminance >= 18 && luminance <= 245) {
      const colorfulBucket = colorfulBuckets.get(key) ?? { red: 0, green: 0, blue: 0, saturation: 0, count: 0 }
      colorfulBucket.red += red
      colorfulBucket.green += green
      colorfulBucket.blue += blue
      colorfulBucket.saturation += saturation
      colorfulBucket.count++
      colorfulBuckets.set(key, colorfulBucket)
    }
  }

  const candidates = [...(colorfulBuckets.size >= 2 ? colorfulBuckets : allBuckets).values()]
    .map(color => ({
      ...color,
      red: color.red / color.count,
      green: color.green / color.count,
      blue: color.blue / color.count,
      saturation: color.saturation / color.count,
    }))
    .sort((first, second) => bucketScore(second) - bucketScore(first))

  const primary = candidates[0]
  if (!primary) {
    throw new Error('Não foi possível encontrar cores na imagem')
  }

  const distinctCandidates = candidates.filter(color => colorDistance(primary, color) >= 48)
  const secondary = [...(distinctCandidates.length ? distinctCandidates : candidates.slice(1))]
    .sort((first, second) => {
      const firstScore = bucketScore(first) * (0.5 + colorDistance(primary, first) / 442)
      const secondScore = bucketScore(second) * (0.5 + colorDistance(primary, second) / 442)
      return secondScore - firstScore
    })[0] ?? primary

  return {
    accent: colorHex(primary),
    secondaryAccent: colorHex(secondary),
  }
}
