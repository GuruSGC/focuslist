// Git repository exists and ignores build output, dependencies and tooling state.
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib/harness.mjs'

const problems = []
if (!existsSync(join(root, '.git'))) problems.push('no .git directory (run git init)')
else {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: root, stdio: 'pipe' })
  } catch {
    problems.push('git does not recognise this folder as a work tree')
  }
}
const ignore = existsSync(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim()) : []
for (const entry of ['node_modules', 'dist']) {
  if (!ignore.includes(entry)) problems.push(`.gitignore should list ${entry}`)
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('GIT-OK')
