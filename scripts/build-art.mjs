// Builds the page backgrounds from real Met Open Access prints.
// Usage: node scripts/build-art.mjs
// 1. Fetches each object's metadata from the Met API and refuses anything not flagged isPublicDomain.
// 2. Downloads the original JPEG into .art-cache/ (git-ignored) if it is not there yet.
// 3. Crops paper margins, makes an art-directed desktop and mobile crop, and writes AVIF + WebP
//    files (each under the size budget) into src/assets/art/.
// 4. Writes src/data/paintings.ts with the paths, credits and placeholder colours.
import { existsSync, mkdirSync, statSync, writeFileSync, createWriteStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cache = join(root, '.art-cache')
const outDir = join(root, 'src', 'assets', 'art')
mkdirSync(cache, { recursive: true })
mkdirSync(outDir, { recursive: true })

const BUDGET = 240 * 1024

/** One entry per page. `margin` trims the paper border of the print in source pixels. */
const WORKS = [
  {
    id: 45434,
    slug: 'great-wave',
    route: 'tasks',
    margin: { left: 0, top: 0, right: 0, bottom: 0 },
    desktop: { mode: 'full', width: 2400, position: '30% 50%' },
    // On a phone only a strip above the panel shows, so zoom in on the crest and its foam.
    mobile: { focusX: 0.3, focusY: 0.4, zoom: 0.55, position: '30% 50%' },
  },
  {
    id: 55743,
    slug: 'ghosts-of-the-taira',
    route: 'overview',
    margin: { left: 70, top: 58, right: 70, bottom: 58 },
    desktop: { mode: 'full', width: 2400, position: '25% 50%' },
    mobile: { focusX: 0.27, focusY: 0.62, zoom: 0.72, position: '27% 50%' },
  },
  {
    id: 36461,
    slug: 'sudden-shower',
    route: 'guide',
    margin: { left: 84, top: 44, right: 84, bottom: 70 },
    desktop: { mode: 'band', width: 1800, focusY: 0.7, position: '50% 70%' },
    mobile: { mode: 'portrait', position: '50% 0%' },
  },
]

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json()
}

async function ensureOriginal(meta, slug) {
  const file = join(cache, `${slug}.jpg`)
  if (existsSync(file)) return file
  const url = meta.primaryImage
  console.log(`Downloading ${slug} from ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(file))
  return file
}

/**
 * Encodes to the size budget. Quality steps down first; the WebP fallback may also step down in
 * resolution (it only serves the few browsers without AVIF), the AVIF never does.
 */
async function encode(pipelineFactory, base, format) {
  const qualities = format === 'avif' ? [52, 46, 40, 34, 28] : [80, 74, 68, 62]
  const scales = format === 'avif' ? [1] : [1, 0.85, 0.7, 0.6]
  let last
  for (const scale of scales) {
    for (const quality of qualities) {
      const image = pipelineFactory(scale)
      const buffer = await (format === 'avif' ? image.avif({ quality, effort: 6 }) : image.webp({ quality, effort: 6 })).toBuffer()
      last = { buffer, quality, scale }
      if (buffer.length <= BUDGET) break
    }
    if (last.buffer.length <= BUDGET) break
  }
  const path = `${base}.${format}`
  writeFileSync(path, last.buffer)
  return { path, bytes: last.buffer.length, quality: last.quality, scale: last.scale }
}

/** Museum metadata uses en and em dashes; the project style is a plain hyphen. */
const clean = (text) => String(text ?? '').replace(/[–—]/g, '-')

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

const records = []
for (const work of WORKS) {
  const meta = await fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${work.id}`)
  if (!meta.isPublicDomain) throw new Error(`Object ${work.id} is not flagged public domain; refusing to use it.`)
  const source = await ensureOriginal(meta, work.slug)
  const info = await sharp(source).metadata()
  const inner = {
    left: work.margin.left,
    top: work.margin.top,
    width: info.width - work.margin.left - work.margin.right,
    height: info.height - work.margin.top - work.margin.bottom,
  }
  const base = () => sharp(source).extract(inner)

  // Desktop crop.
  let desktop
  if (work.desktop.mode === 'band') {
    const bandHeight = Math.round(inner.width / 1.6)
    const top = Math.min(inner.height - bandHeight, Math.max(0, Math.round(inner.height * work.desktop.focusY - bandHeight / 2)))
    desktop = (scale = 1) =>
      sharp(source)
        .extract({ left: inner.left, top: inner.top + top, width: inner.width, height: bandHeight })
        .resize({ width: Math.round(work.desktop.width * scale) })
  } else {
    desktop = (scale = 1) => base().resize({ width: Math.round(work.desktop.width * scale) })
  }

  // Mobile crop: a portrait window, or the whole portrait print.
  let mobile
  if (work.mobile.mode === 'portrait') {
    mobile = (scale = 1) => base().resize({ width: Math.round(900 * scale) })
  } else {
    const zoom = work.mobile.zoom ?? 1
    const cropHeight = Math.round(inner.height * zoom)
    const cropWidth = Math.round(cropHeight * (9 / 16))
    const left = Math.min(inner.width - cropWidth, Math.max(0, Math.round(inner.width * work.mobile.focusX - cropWidth / 2)))
    const top = Math.min(inner.height - cropHeight, Math.max(0, Math.round(inner.height * (work.mobile.focusY ?? 0.5) - cropHeight / 2)))
    mobile = (scale = 1) =>
      sharp(source)
        .extract({ left: inner.left + left, top: inner.top + top, width: cropWidth, height: cropHeight })
        .resize({ width: Math.round(900 * scale), height: Math.round(1600 * scale) })
  }

  const files = {}
  for (const [label, factory] of [
    ['desktop', desktop],
    ['mobile', mobile],
  ]) {
    const size = await factory().toBuffer({ resolveWithObject: true })
    files[label] = { width: size.info.width, height: size.info.height }
    for (const format of ['avif', 'webp']) {
      const result = await encode(factory, join(outDir, `${work.slug}-${label}`), format)
      files[label][format] = `${work.slug}-${label}.${format}`
      console.log(`${work.slug}-${label}.${format}: ${(result.bytes / 1024).toFixed(0)} KB (q${result.quality})`)
    }
  }

  const stats = await sharp(source).resize(32, 32, { fit: 'cover' }).stats()
  const [r, g, b] = stats.channels.map((channel) => channel.mean)
  records.push({
    id: work.id,
    slug: work.slug,
    route: work.route,
    title: clean(meta.title),
    artist: clean(meta.artistDisplayName),
    date: clean(meta.objectDate),
    creditLine: clean(meta.creditLine),
    objectUrl: meta.objectURL,
    color: hex({ r, g, b }),
    positionDesktop: work.desktop.position,
    positionMobile: work.mobile.position,
    files,
  })
}

const importName = (slug, label, format) => `${slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}${label[0].toUpperCase()}${label.slice(1)}${format[0].toUpperCase()}${format.slice(1)}`
const imports = []
const entries = records.map((record) => {
  const lines = []
  for (const label of ['desktop', 'mobile']) {
    for (const format of ['avif', 'webp']) {
      const name = importName(record.slug, label, format)
      imports.push(`import ${name} from '../assets/art/${record.files[label][format]}'`)
    }
  }
  const pick = (label) =>
    `{ avif: ${importName(record.slug, label, 'avif')}, webp: ${importName(record.slug, label, 'webp')}, width: ${record.files[label].width}, height: ${record.files[label].height} }`
  lines.push(`  ${JSON.stringify(record.route)}: {`)
  lines.push(`    id: ${record.id},`)
  lines.push(`    slug: ${JSON.stringify(record.slug)},`)
  lines.push(`    title: ${JSON.stringify(record.title)},`)
  lines.push(`    artist: ${JSON.stringify(record.artist)},`)
  lines.push(`    date: ${JSON.stringify(record.date)},`)
  lines.push(`    creditLine: ${JSON.stringify(record.creditLine)},`)
  lines.push(`    objectUrl: ${JSON.stringify(record.objectUrl)},`)
  lines.push(`    color: ${JSON.stringify(record.color)},`)
  lines.push(`    positionDesktop: ${JSON.stringify(record.positionDesktop)},`)
  lines.push(`    positionMobile: ${JSON.stringify(record.positionMobile)},`)
  lines.push(`    desktop: ${pick('desktop')},`)
  lines.push(`    mobile: ${pick('mobile')},`)
  lines.push('  },')
  return lines.join('\n')
})

writeFileSync(
  join(root, 'src', 'data', 'paintings.ts'),
  `// Generated by scripts/build-art.mjs from the Met Open Access API. Do not edit by hand.
import type { Painting } from '../types'
${imports.join('\n')}

export const PAINTINGS: Record<'tasks' | 'overview' | 'guide', Painting> = {
${entries.join('\n')}
}
`,
)

const total = records.flatMap((r) => ['desktop', 'mobile'].flatMap((l) => ['avif', 'webp'].map((f) => statSync(join(outDir, r.files[l][f])).size))).reduce((a, b) => a + b, 0)
console.log(`Wrote src/data/paintings.ts. Total art on disk: ${(total / 1024).toFixed(0)} KB across ${records.length * 4} files.`)
