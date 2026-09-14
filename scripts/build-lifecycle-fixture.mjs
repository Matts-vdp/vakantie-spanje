// Builds the committed phase-1 application in an ignored fixture directory.
// No checkout, working-tree replacement or traveller data is involved.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
const baseline = 'b19af3327af667c9a959e7da17e429bf0c584325'
const root = resolve('node_modules/.cache/lifecycle-old')
const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline], { encoding: 'utf8' }).trim().split('\n').filter(p => p.startsWith('src/') || p.startsWith('public/') || ['index.html', 'vite.config.ts', 'package.json', 'tsconfig.json'].includes(p))
for (const path of paths) {
  const output = resolve(root, path)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 5_000_000 }))
}
execFileSync(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'build', root, '--config', resolve(root, 'vite.config.ts')], { stdio: 'inherit' })
