import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BASE, DEFAULTS, type Settings, type Item } from './types'
import { hitAt } from './hit'
import { ring, setVolume, loadCustom } from './audio'
import Petals, { type PetalsApi } from './Petals'
import Toran from './Toran'

const initial = (s?: Settings | null): Settings => ({
  intensity: .6, hoverFx: true, petals: true, volume: .7, muted: false, alwaysOnTop: true, launchAtLogin: false, ...s,
  items: Object.fromEntries(Object.entries(DEFAULTS).map(([id, d]) => [id, { x: d.x, y: d.y, scale: d.scale, visible: true, on: true, ...s?.items?.[id] }])),
})

export default function App() {
  const [s, setS] = useState<Settings>(() => initial())
  const [edit, setEdit] = useState(false)
  const [panel, setPanel] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [bellKey, setBellKey] = useState(0)
  const [hover, setHover] = useState(false)
  const [swayKey, setSwayKey] = useState(0)
  const petals = useRef<PetalsApi>(null)
  const editRef = useRef(edit); editRef.current = edit
  const panelRef = useRef(panel); panelRef.current = panel

  useEffect(() => { window.pooja.getSettings().then((v) => { setS(initial(v)); setLoaded(true) }); return window.pooja.onEditToggle(() => setEdit((e) => !e)) }, [])
  useEffect(() => { if (!loaded) return; const t = setTimeout(() => window.pooja.saveSettings(s), 400); return () => clearTimeout(t) }, [s, loaded])
  useEffect(() => { setVolume(s.volume, s.muted) }, [s.volume, s.muted])
  useEffect(() => { loadCustom((s.items as any).bellsound?.src) }, [(s.items as any).bellsound?.src])

  // Pointer routing: window is click-through by default; becomes interactive only over a decoration/panel.
  useEffect(() => {
    let cur = false
    const move = (e: MouseEvent) => { const h = hitAt(e.clientX, e.clientY, editRef.current); if (h !== cur) { cur = h; window.pooja.setInteractive(h) } }
    addEventListener('mousemove', move)
    return () => removeEventListener('mousemove', move)
  }, [])

  const set = useCallback((p: Partial<Settings>) => setS((v) => ({ ...v, ...p })), [])
  const setItem = useCallback((id: string, p: Partial<Item>) => setS((v) => ({ ...v, items: { ...v.items, [id]: { ...v.items[id], ...p } } })), [])
  const k = s.intensity

  const drag = (id: string) => (e: React.PointerEvent) => {
    if (!edit) return
    const it = s.items[id], sx = e.clientX, sy = e.clientY
    const el = e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId)
    const mv = (m: PointerEvent) => setItem(id, { x: it.x + (m.clientX - sx) / innerWidth, y: it.y + (m.clientY - sy) / innerHeight })
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up) }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up)
  }
  const wheel = (id: string) => (e: React.WheelEvent) => { if (edit) setItem(id, { scale: Math.min(4, Math.max(.2, s.items[id].scale * (e.deltaY < 0 ? 1.06 : .94))) }) }
  const box = (id: string): React.CSSProperties => {
    const it = s.items[id], d = DEFAULTS[id]
    return { left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: d.w * it.scale, display: it.visible ? undefined : 'none' }
  }
  const src = (id: string) => s.items[id].src ?? BASE + DEFAULTS[id].kind + '.png'
  const common = (id: string) => ({ className: 'deco' + (edit ? ' editing' : ''), style: box(id), onPointerDown: drag(id), onWheel: wheel(id) })

  const style = useMemo(() => ({ '--k': k } as React.CSSProperties), [k])

  const pick = async (kind: string, id: string) => { const u = await window.pooja.importAsset(kind); if (u) setItem(id, { src: u }) }

  return (
    <div className="stage" style={style}>
      <Petals ref={petals} continuous={s.petals} intensity={k} />

      {/* Full-width 3D animated toran — always at top */}
      <Toran src={src('toran')} intensity={k} />

      {/* Bell — clickable */}
      <div {...common('bell')} data-hit="img" style={{ ...box('bell'), transformOrigin: 'top center' }}
        onClick={() => { if (!edit) { ring(); setBellKey((n) => n + 1) } }}>
        <img key={bellKey} className={bellKey ? 'swing' : ''} src={src('bell')} draggable={false} />
      </div>

      {/* Lamps */}
      {(['hanglamp', 'lampL', 'lampR'] as const).map((id) => {
        const on = s.items[id].on
        return (
          <div key={id} {...common(id)} data-hit="img" onClick={() => !edit && setItem(id, { on: !on })}>
            <div className={'lampwrap' + (on ? ' lit' : ' unlit') + (id === 'hanglamp' ? ' hang' : '')}>
              <img src={src(id)} draggable={false} style={id === 'lampR' ? { transform: 'scaleX(-1)' } : undefined} />
              {on && <i className="glow-flame" style={{ top: id === 'hanglamp' ? '60%' : '24%' }} />}
            </div>
          </div>)
      })}

      <div {...common('tilak')}><img data-hit="img" src={src('tilak')} draggable={false} /></div>

      {edit && <div className="hint" data-hit="box">EDIT MODE — drag to move · scroll to resize · Ctrl+Alt+E to finish</div>}
      <button className="fab" data-hit="box" title="Pooja controls" onClick={() => setPanel((p) => !p)}>🌸</button>

      {panel && (
        <div className="panel" data-hit="box">
          <h3>Aatha Pooja</h3>
          <div className="row">
            <button onClick={() => setEdit((e) => !e)}>{edit ? 'Done editing' : 'Edit layout'}</button>
            <button onClick={() => petals.current?.shower(180)}>🌼 Flower shower</button>
          </div>
          <label><input type="checkbox" checked={s.petals} onChange={(e) => set({ petals: e.target.checked })} /> Continuous petals</label>
          <label><input type="checkbox" checked={s.hoverFx} onChange={(e) => set({ hoverFx: e.target.checked })} /> Hover effects</label>
          <label><input type="checkbox" checked={s.alwaysOnTop} onChange={(e) => set({ alwaysOnTop: e.target.checked })} /> Always on top</label>
          <label><input type="checkbox" checked={s.launchAtLogin} onChange={(e) => set({ launchAtLogin: e.target.checked })} /> Start with Windows</label>
          <label>Animation intensity<input type="range" min="0" max="1" step=".05" value={s.intensity} onChange={(e) => set({ intensity: +e.target.value })} /></label>
          <label>Bell volume<input type="range" min="0" max="1" step=".05" value={s.volume} onChange={(e) => set({ volume: +e.target.value })} />
            <input type="checkbox" checked={s.muted} onChange={(e) => set({ muted: e.target.checked })} /> mute</label>
          <details><summary>Decorations</summary>
            {Object.entries(DEFAULTS).filter(([id]) => id !== 'amman').map(([id, d]) => (
              <div className="row" key={id}>
                <label style={{ flex: 1 }}><input type="checkbox" checked={s.items[id].visible} onChange={(e) => setItem(id, { visible: e.target.checked })} /> {d.label}</label>
                <input type="range" min=".4" max="2.5" step=".05" value={s.items[id].scale} onChange={(e) => setItem(id, { scale: +e.target.value })} style={{ width: 70 }} />
              </div>))}
          </details>
          <details><summary>Import assets</summary>
            <div className="grid">
              <button onClick={() => pick('toran', 'toran')}>Garland</button>
              <button onClick={() => pick('bell', 'bell')}>Bell image</button>
              <button onClick={() => pick('lamp', 'lampL')}>Vilakku L</button>
              <button onClick={() => pick('lamp', 'lampR')}>Vilakku R</button>
              <button onClick={() => pick('hanglamp', 'hanglamp')}>Hanging lamp</button>
              <button onClick={async () => { const u = await window.pooja.importAsset('bellsound'); if (u) setS((v) => ({ ...v, items: { ...v.items, bellsound: { x: 0, y: 0, scale: 1, visible: true, on: true, src: u } } })) }}>Bell sound</button>
            </div></details>
          <div className="row">
            <button onClick={() => setS(initial({ ...s, items: {} } as Settings))}>Reset layout</button>
            <button onClick={() => window.pooja.hide()}>Hide (Ctrl+Alt+P)</button>
            <button className="danger" onClick={() => window.pooja.quit()}>Exit</button>
          </div>
        </div>)}
    </div>
  )
}
