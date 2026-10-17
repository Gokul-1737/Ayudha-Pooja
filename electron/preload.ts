import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('pooja', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: unknown) => ipcRenderer.invoke('settings:set', s),
  setInteractive: (on: boolean) => ipcRenderer.send('interactive', !!on),
  importAsset: (kind: string) => ipcRenderer.invoke('asset:import', kind),
  onEditToggle: (cb: () => void) => { const f = () => cb(); ipcRenderer.on('edit-toggle', f); return () => ipcRenderer.removeListener('edit-toggle', f) },
  hide: () => ipcRenderer.send('hide'),
  quit: () => ipcRenderer.send('quit'),
})
