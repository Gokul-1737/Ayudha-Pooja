export interface Item { x: number; y: number; scale: number; visible: boolean; on: boolean; src?: string }
export interface Settings { items: Record<string, Item>; intensity: number; hoverFx: boolean; petals: boolean; volume: number; muted: boolean; alwaysOnTop: boolean; launchAtLogin: boolean }
declare global { interface Window { pooja: {
  getSettings(): Promise<Settings | null>; saveSettings(s: Settings): Promise<boolean>; setInteractive(on: boolean): void
  importAsset(kind: string): Promise<string | null>; onEditToggle(cb: () => void): () => void; hide(): void; quit(): void } } }

export const BASE = import.meta.env.BASE_URL + 'assets/'
// Default layout (fractions of the work area, item centre) — derived from the supplied references
export const DEFAULTS: Record<string, Item & { label: string; kind: string; w: number }> = {
  toran:    { label: 'Marigold toran',      kind: 'toran',   w: 600, x: .5,  y: .235, scale: 1, visible: true, on: true },
  bell:     { label: 'Temple bell',         kind: 'bell',    w: 70,  x: .30, y: .2,  scale: 1, visible: true, on: true },
  hanglamp: { label: 'Hanging vilakku',     kind: 'hanglamp',w: 120, x: .70, y: .21, scale: 1, visible: true, on: true },
  lampL:    { label: 'Vilakku (left)',      kind: 'lamp',    w: 170, x: .34, y: .79, scale: 1, visible: true, on: true },
  lampR:    { label: 'Vilakku (right)',     kind: 'lamp',    w: 170, x: .66, y: .79, scale: 1, visible: true, on: true },
  tilak:    { label: 'Vibhuti & kumkum',    kind: 'tilak',   w: 110, x: .5,  y: .875, scale: 1, visible: true, on: true },
}

