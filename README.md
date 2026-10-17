# Aatha Pooja – transparent desktop overlay (Windows)
Run: `npm install` then `npm run dev` (or `npm run start`). Package installer: `npm run build`.

Shortcuts: Ctrl+Alt+P show/hide · Ctrl+Alt+E edit layout (drag / scroll to resize) · Ctrl+Alt+Q exit. 🌸 button (bottom-right) opens controls.

Click-through: the window is created with setIgnoreMouseEvents(true,{forward:true}). The renderer alpha-tests the pixel under
the cursor (src/hit.ts) and asks main (validated IPC) to make the window interactive only over opaque decoration pixels or the panel.
Window covers the work area, so the taskbar stays visible. No wallpaper is read, drawn or modified.

Assets: public/assets/*.png are your 5 references with white backgrounds removed. Import Amman image / custom bell image / bell sound
from the panel; imports are copied to %APPDATA%/aatha-pooja/assets and served via the pooja:// protocol. Settings persist in settings.json.
