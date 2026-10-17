import { app, BrowserWindow, globalShortcut, ipcMain, dialog, screen, protocol, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

protocol.registerSchemesAsPrivileged([{ scheme: 'pooja', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }])

const store = () => path.join(app.getPath('userData'), 'settings.json')
const assetDir = () => path.join(app.getPath('userData'), 'assets')
const KINDS = ['amman', 'frame', 'toran', 'bell', 'hanglamp', 'lamp', 'tilak', 'bellsound'] as const
const EXT: Record<string, string[]> = { img: ['png', 'webp', 'jpg', 'jpeg'], snd: ['mp3', 'wav', 'ogg'] }
const MIME: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' }

let win: BrowserWindow | null = null
let tray: Tray | null = null
let alwaysOnTop = true

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)
function sanitize(s: any) {
  const items: Record<string, any> = {}
  if (s && typeof s.items === 'object') for (const [id, it] of Object.entries<any>(s.items).slice(0, 24)) {
    if (!/^[a-z0-9-]{1,24}$/.test(id) || typeof it !== 'object') continue
    items[id] = { x: num(it.x, -0.2, 1.2, 0.5), y: num(it.y, -0.2, 1.2, 0.5), scale: num(it.scale, 0.2, 4, 1), visible: it.visible !== false, on: it.on !== false,
      src: typeof it.src === 'string' && /^pooja:\/\/asset\/[\w.-]+$/.test(it.src) ? it.src : undefined }
  }
  return { items, intensity: num(s?.intensity, 0, 1, 0.6), hoverFx: s?.hoverFx !== false, petals: !!s?.petals,
    volume: num(s?.volume, 0, 1, 0.7), muted: !!s?.muted, alwaysOnTop: s?.alwaysOnTop !== false, launchAtLogin: !!s?.launchAtLogin }
}
const load = () => { try { return sanitize(JSON.parse(fs.readFileSync(store(), 'utf8'))) } catch { return sanitize({}) } }

function trusted(e: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) {
  const u = e.senderFrame?.url ?? ''
  return u.startsWith('file://') || u.startsWith('http://localhost')
}

function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea // workArea keeps the taskbar visible
  alwaysOnTop = load().alwaysOnTop
  win = new BrowserWindow({
    x, y, width, height, transparent: true, frame: false, hasShadow: false, resizable: false, movable: false,
    skipTaskbar: true, show: false, backgroundColor: '#00000000', alwaysOnTop,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  })
  win.setIgnoreMouseEvents(true, { forward: true }) // click-through by default; renderer toggles over decorations
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL)
  else win.loadFile(path.join(__dirname, '../dist/index.html'))
  win.once('ready-to-show', () => {
    win?.show()
    if (process.env.VITE_DEV_SERVER_URL) {
      win?.webContents.openDevTools({ mode: 'detach' })
    }
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (e) => e.preventDefault())
}

const toggleVisible = () => (win?.isVisible() ? win.hide() : win?.showInactive())

app.whenReady().then(() => {
  fs.mkdirSync(assetDir(), { recursive: true })
  protocol.handle('pooja', (req) => {
    const name = path.basename(decodeURIComponent(new URL(req.url).pathname))
    const file = path.join(assetDir(), name)
    if (!file.startsWith(assetDir()) || !fs.existsSync(file)) return new Response('', { status: 404 })
    return new Response(fs.readFileSync(file), { headers: { 'content-type': MIME[path.extname(name).slice(1)] ?? 'application/octet-stream', 'access-control-allow-origin': '*' } })
  })
  createWindow()
  tray = new Tray(nativeImage.createEmpty().isEmpty() ? nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==') : nativeImage.createEmpty())
  tray.setToolTip('Ayudha Pooja')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / Hide (Ctrl+Alt+P)', click: toggleVisible },
    { label: 'Edit mode (Ctrl+Alt+E)', click: () => win?.webContents.send('edit-toggle') },
    { label: 'Exit', click: () => app.quit() },
  ]))
  globalShortcut.register('Control+Alt+P', toggleVisible)
  globalShortcut.register('Control+Alt+E', () => { win?.showInactive(); win?.webContents.send('edit-toggle') })
  globalShortcut.register('Control+Alt+Q', () => app.quit())
})

ipcMain.handle('settings:get', (e) => (trusted(e) ? load() : null))
ipcMain.handle('settings:set', (e, s) => {
  if (!trusted(e)) return false
  const clean = sanitize(s)
  fs.writeFileSync(store(), JSON.stringify(clean))
  if (clean.alwaysOnTop !== alwaysOnTop) { alwaysOnTop = clean.alwaysOnTop; win?.setAlwaysOnTop(alwaysOnTop) }
  app.setLoginItemSettings({ openAtLogin: clean.launchAtLogin })
  return true
})
ipcMain.on('interactive', (e, on: unknown) => {
  if (!trusted(e) || typeof on !== 'boolean') return
  if (on) win?.setIgnoreMouseEvents(false)
  else win?.setIgnoreMouseEvents(true, { forward: true })
})
ipcMain.handle('asset:import', async (e, kind: unknown) => {
  if (!trusted(e) || !KINDS.includes(kind as any) || !win) return null
  const snd = kind === 'bellsound'
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: snd ? 'Audio' : 'Images', extensions: EXT[snd ? 'snd' : 'img'] }] })
  if (r.canceled || !r.filePaths[0]) return null
  const ext = path.extname(r.filePaths[0]).slice(1).toLowerCase()
  if (!EXT[snd ? 'snd' : 'img'].includes(ext)) return null
  const name = `${kind}-${Date.now()}.${ext}`
  fs.copyFileSync(r.filePaths[0], path.join(assetDir(), name))
  return `pooja://asset/${name}`
})
ipcMain.on('quit', (e) => { if (trusted(e)) app.quit() })
ipcMain.on('hide', (e) => { if (trusted(e)) win?.hide() })
app.on('will-quit', () => globalShortcut.unregisterAll())
