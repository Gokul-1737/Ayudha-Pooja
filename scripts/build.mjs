// scripts/build.mjs — Production build script
import { build } from 'esbuild'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

async function buildElectron() {
  const outdir = path.join(ROOT, 'dist-electron')
  fs.mkdirSync(outdir, { recursive: true })

  const shared = {
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    sourcemap: false,
    minify: true,
  }

  await Promise.all([
    build({
      ...shared,
      entryPoints: [path.join(ROOT, 'electron/main.ts')],
      outfile: path.join(outdir, 'main.js'),
      format: 'cjs',
    }),
    build({
      ...shared,
      entryPoints: [path.join(ROOT, 'electron/preload.ts')],
      outfile: path.join(outdir, 'preload.js'),
      format: 'cjs',
    }),
  ])

  console.log('✓ Compiled electron/main.ts and preload.ts into dist-electron/')
}

buildElectron().catch((err) => {
  console.error('Build error:', err)
  process.exit(1)
})
