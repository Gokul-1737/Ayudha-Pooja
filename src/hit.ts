// Decides whether the pointer is over something interactive. Images are alpha-tested so transparent
// pixels (and the desktop beneath them) stay clickable; boxes/panels are always solid.
const cache = new WeakMap<HTMLImageElement, ImageData | null>()
function data(img: HTMLImageElement) {
  if (cache.has(img)) return cache.get(img)!
  let d: ImageData | null = null
  try { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
    const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0); d = x.getImageData(0, 0, c.width, c.height) } catch { d = null }
  cache.set(img, d); return d
}
export function hitAt(x: number, y: number, edit: boolean): boolean {
  for (const el of document.elementsFromPoint(x, y)) {
    const h = (el as HTMLElement).closest?.('[data-hit]') as HTMLElement | null
    if (!h) continue
    if (edit || h.dataset.hit === 'box') return true
    const img = (el instanceof HTMLImageElement ? el : h.querySelector('img')) as HTMLImageElement | null
    if (!img || !img.naturalWidth) return true
    const d = data(img); if (!d) return true
    const r = img.getBoundingClientRect()
    const u = (x - r.left) / r.width, v = (y - r.top) / r.height
    if (u < 0 || v < 0 || u > 1 || v > 1) continue
    const k = Math.max(1, Math.round(6 * img.naturalWidth / r.width)) // generous radius so thin chains are clickable
    for (const [dx, dy] of [[0, 0], [k, 0], [-k, 0], [0, k], [0, -k]]) {
      const px = Math.min(d.width - 1, Math.max(0, Math.round(u * d.width) + dx)), py = Math.min(d.height - 1, Math.max(0, Math.round(v * d.height) + dy))
      if (d.data[(py * d.width + px) * 4 + 3] > 40) return true
    }
  }
  return false
}
