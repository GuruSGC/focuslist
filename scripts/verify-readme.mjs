// README documents the project and points at real screenshots and a live URL.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib/harness.mjs'

const path = join(root, 'README.md')
if (!existsSync(path)) {
  console.error('README.md is missing')
  process.exit(1)
}
const text = readFileSync(path, 'utf8')
const problems = []

for (const section of ['Overview', 'Features', 'Tech stack', 'Setup', 'Architecture', 'Accessibility', 'Performance', 'Deployment', 'Screenshots']) {
  if (!new RegExp(`^#{1,3}\\s+.*${section}`, 'im').test(text)) problems.push(`missing a "${section}" heading`)
}
const live = text.match(/https:\/\/[^\s)]+\.(vercel\.app|netlify\.app|pages\.dev|github\.io)[^\s)]*/i)
if (!live) problems.push('no live deployment URL found')
if (/\b(TODO|TBD|lorem ipsum|coming soon)\b/i.test(text)) problems.push('contains placeholder text')

const images = [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1])
if (images.length < 3) problems.push(`expected at least 3 screenshots, found ${images.length}`)
for (const image of images) {
  const file = join(root, image)
  if (!existsSync(file) || statSync(file).size < 5000) problems.push(`screenshot ${image} is missing or too small`)
}

if (problems.length) {
  console.error(`README problems:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log('README-OK')
