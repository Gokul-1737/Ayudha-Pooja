// Polyphonic synthesized temple bell (inharmonic partials) — every click spawns an independent voice, so rapid clicks never glitch.
let ctx: AudioContext | null = null
let master: GainNode
let custom: AudioBuffer | null = null
const ac = () => { if (!ctx) { ctx = new AudioContext(); master = ctx.createGain(); master.connect(ctx.destination) } return ctx }
export function setVolume(v: number, muted: boolean) { ac(); master.gain.value = muted ? 0 : v }
export async function loadCustom(url: string | undefined) {
  custom = null; if (!url) return
  try { custom = await ac().decodeAudioData(await (await fetch(url)).arrayBuffer()) } catch { custom = null }
}
export function ring() {
  const c = ac(); if (c.state === 'suspended') c.resume()
  const t = c.currentTime
  const strike = (at: number, amp: number) => {
    if (custom) { const s = c.createBufferSource(); s.buffer = custom; s.connect(master); s.start(at); return }
    const g = c.createGain(); g.connect(master)
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(amp, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6)
    for (const [r, a, d] of [[1, 1, 1], [2.01, .6, .8], [2.76, .5, .55], [4.07, .35, .4], [5.43, .22, .3], [7.1, .12, .2]]) {
      const o = c.createOscillator(), og = c.createGain()
      o.frequency.value = 1180 * r; og.gain.value = a
      og.gain.setValueAtTime(a, at); og.gain.exponentialRampToValueAtTime(0.0001, at + 2.6 * d)
      o.connect(og).connect(g); o.start(at); o.stop(at + 2.7)
    }
  }
  strike(t, 0.5); if (!custom) strike(t + 0.42, 0.42) // "ding… ding"
}
