import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
export interface PetalsApi { shower(n?: number, ox?: number, oy?: number): void }
const COLORS = ['#e8456b', '#f6a5b8', '#ffd23f', '#ff9f1c', '#fffaf0']
interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; c: string; life: number }
// Lightweight canvas petals; the loop only runs while petals exist (zero idle cost).
export default forwardRef<PetalsApi, { continuous: boolean; intensity: number }>(function Petals({ continuous, intensity }, ref) {
  const cv = useRef<HTMLCanvasElement>(null), ps = useRef<P[]>([]), raf = useRef(0), cont = useRef(continuous), inten = useRef(intensity)
  cont.current = continuous; inten.current = intensity
  const spawn = (n: number, ox?: number, oy?: number) => {
    const W = innerWidth
    for (let i = 0; i < n; i++) ps.current.push({
      x: ox ?? Math.random() * W, y: oy ?? -20 - Math.random() * 200, vx: (Math.random() - .5) * (oy === undefined ? 1 : 5), vy: oy === undefined ? 1 + Math.random() * 1.5 : -2 - Math.random() * 3,
      r: 5 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - .5) * .08, c: COLORS[(Math.random() * COLORS.length) | 0], life: 1 })
    if (!raf.current) raf.current = requestAnimationFrame(loop)
  }
  const loop = () => {
    const c = cv.current!, x = c.getContext('2d')!
    x.clearRect(0, 0, c.width, c.height)
    if (cont.current && Math.random() < .25 * inten.current) spawn(1)
    ps.current = ps.current.filter((p) => p.y < c.height + 20)
    for (const p of ps.current) {
      p.vy += oyGravity; p.vy = Math.min(p.vy, 2.6); p.x += p.vx + Math.sin(p.a) * .6; p.y += p.vy; p.a += p.va
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.scale(1, .6); x.fillStyle = p.c; x.globalAlpha = .9
      x.beginPath(); x.ellipse(0, 0, p.r, p.r * .65, 0, 0, 7); x.fill(); x.restore()
    }
    raf.current = ps.current.length || cont.current ? requestAnimationFrame(loop) : 0
  }
  const oyGravity = 0.03
  useImperativeHandle(ref, () => ({ shower: (n = 90, ox, oy) => spawn(Math.round(n * Math.max(.3, inten.current * 1.4)), ox, oy) }))
  useEffect(() => { const f = () => { cv.current!.width = innerWidth; cv.current!.height = innerHeight }; f(); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  useEffect(() => { if (continuous && !raf.current) raf.current = requestAnimationFrame(loop) }, [continuous])
  return <canvas ref={cv} className="petals" />
})
