// scripts/dev.mjs — Custom dev launcher for Electron + Vite 6
// Compiles electron/main.ts + preload.ts with esbuild, starts Vite dev server, then launches Electron.
import { build } from 'esbuild'
import { createServer } from 'vite'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const require = createRequire(import.meta.url)

// Resolve electron binary cross-platform (works on Windows too)
const electronPath = require('electron')

async function buildElectron() {
  const outdir = path.join(ROOT, 'dist-electron')
  fs.mkdirSync(outdir, { recursive: true })

  const shared = {
    bundle: true,
    platform: 'node',
    target: 'node20',
    external: ['electron'],
    sourcemap: true,
    logLevel: 'silent', // suppress parallel output collision
  }

  const [r1, r2] = await Promise.all([
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

  console.log('  ✓ dist-electron/main.js')
  console.log('  ✓ dist-electron/preload.js')
}

async function main() {
  console.log('\n🔨 Building electron main + preload...')
  await buildElectron()

  console.log('\n🚀 Starting Vite dev server...')
  const vite = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, 'vite.config.ts'),
  })
  await vite.listen()
  const devUrl = vite.resolvedUrls?.local[0] ?? 'http://localhost:5173/'
  console.log(`✅ Vite ready → ${devUrl}`)

  console.log('⚡ Launching Electron...\n')
  const child = spawn(electronPath, ['.'], {
    cwd: ROOT,
    env: { ...process.env, VITE_DEV_SERVER_URL: devUrl },
    stdio: 'inherit',
  })

  child.on('close', (code) => {
    console.log(`\nElectron exited (${code}). Closing Vite...`)
    vite.close()
    process.exit(0)
  })

  child.on('error', (err) => {
    console.error('Failed to start Electron:', err.message)
    vite.close()
    process.exit(1)
  })
}

main().catch((e) => { console.error(e); process.exit(1) })
