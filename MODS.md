# Super Productivity — Mods System

> **All credit for the original application goes to [Johannes Millan](https://github.com/johannesjo) and every contributor to [Super Productivity](https://github.com/johannesjo/super-productivity).** This file documents only the personal mods added on top of their work. The original project is an outstanding open-source productivity tool — please star, support, and contribute to it.

This fork adds a fully client-side **Mods** panel to [Super Productivity](https://github.com/johannesjo/super-productivity) that lets users personalize the app with custom cursors, backgrounds, particle effects, and draggable stamps — all stored in `localStorage` and compatible with the Electron desktop app.

No backend changes. No new dependencies beyond what the project already ships.

---

## Features

### 🖱️ Custom Cursor

- Built-in presets: default, anime arrow, heart, star, magic wand, Mummy (bundled PNG pair)
- Upload your own cursor image for the **idle** state and a separate file for the **hover/pointer** state
- Supported formats: **PNG, GIF, WebP, `.cur`**
- Adjustable **size** (16–128 px) and **opacity** (10–100%) applied via canvas processing
- Hover cursor is automatically injected via a `<style>` tag for all interactive elements (buttons, links, chips, etc.)

> ⚠️ **`.ani` (Windows Animated Cursor) is not supported.** No modern browser supports the `.ani` format in the CSS `cursor` property via data URLs. Implementing it would require a full RIFF binary parser, a `.cur`/`.ico` frame extractor, and a fake DOM cursor driven by `requestAnimationFrame` — roughly 500 lines of work for a format that has been obsolete since Internet Explorer. Use `.gif` or `.webp` for animated-looking cursors instead (note: browsers display only the first frame of any image used as a cursor, so true animation is not possible on the web).

### 🌄 Custom Background

- Solid color with opacity control
- Image background (upload local file or paste a URL) with blur and opacity sliders
- Rendered as a `position: fixed` layer behind all app content (`z-index: 0`)

### ✨ Particle Effects

- 8 modes: Stars, Petals, Snow, Bubbles, Confetti, Matrix, Fireflies, Sparkles
- Per-mode controls: quantity, speed, opacity, color
- Canvas-based, runs outside Angular's change detection for performance
- Pauses automatically when the tab is hidden (Visibility API)

### 🖼️ Stamps

- Add any image as a freely draggable stamp on the screen
- Drag via Pointer Events API with `setPointerCapture` (smooth, no Angular CD overhead)
- 4 shape modes per stamp, changeable on the fly without re-uploading:
  - **Square** — default, slight border-radius
  - **Oval** — `border-radius: 50%`
  - **Rectangle H** — landscape aspect ratio (1.6×)
  - **Rectangle V** — portrait aspect ratio (×1.6)
- Global size slider (50–250 px base); each stamp stores its own `x`, `y`, `size`, `shape`

---

## Technical notes

| Concern                 | Solution                                                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistence in Electron | All file uploads use `FileReader → readAsDataURL()` → base64 stored in `localStorage`. Blob URLs are **not** used (they don't survive app restarts).                                            |
| Single AudioContext     | `SoundService` was consolidated to always use the shared `getAudioContext()` singleton from `audio-context.ts`, fixing a dual-context bug where `_resumeCtx()` was resuming the wrong instance. |
| Performance             | Particle loop and stamp drag both run in `NgZone.runOutsideAngular`. Canvas resize observer handles responsive layout.                                                                          |
| Cursor image processing | Size and opacity are applied via an offscreen `<canvas>` before setting `document.body.style.cursor`. A generation counter prevents stale async updates when sliders are moved quickly.         |
| No new runtime deps     | `nanoid` (already in the project) is the only addition used for stamp IDs.                                                                                                                      |

---

## File structure

```
src/app/mods/
├── mods.service.ts                  # Central signal-based config, localStorage persistence
├── custom-cursor/
│   └── custom-cursor.service.ts    # Applies cursor + injects pointer <style>
├── background/
│   └── background.component.ts     # Fixed z-index:0 overlay
├── particles/
│   └── particles.component.ts      # Canvas, 8 modes, outside NgZone
├── stamps/
│   └── stamps.component.ts         # Draggable stamps, Pointer Events API
└── mods-panel/
    ├── mods-panel.component.ts
    ├── mods-panel.component.html    # 4-tab custom tab bar (no mat-tab-group overflow)
    └── mods-panel.component.scss

src/assets/
├── cursors/
│   ├── mummy-cursor.png
│   └── mummy-pointer.png
└── snd/
    ├── pencil-writing.mp3           # Pre-loaded at service init for zero-latency first keystroke
    └── paper-crumple.mp3
```

---

## Running locally

```bash
npm install
npx ng serve          # browser dev server → localhost:4200
```

The Electron build uses the standard upstream scripts (`npm start` after fixing the Electron binary if needed).

---

## Config keys

| Key                | Storage        | Content                                        |
| ------------------ | -------------- | ---------------------------------------------- |
| `sp-mods-config`   | `localStorage` | Cursor, background, stamps, particles settings |
| `sp-sound-config`  | `localStorage` | Sound preset and volume                        |
| `sp-custom-sounds` | `IndexedDB`    | Custom audio file buffers                      |

---

## Credits

The entirety of the application — architecture, features, design, CI, translations, documentation, and years of maintenance — is the work of **[Johannes Millan](https://github.com/johannesjo)** and the [Super Productivity contributors](https://github.com/johannesjo/super-productivity/graphs/contributors).

This fork adds only a cosmetic mods layer on top of their work. If you find Super Productivity useful, please:

- ⭐ [Star the original repository](https://github.com/johannesjo/super-productivity)
- 💬 [Join the community](https://github.com/johannesjo/super-productivity/discussions)
- 🐛 [Report bugs upstream](https://github.com/johannesjo/super-productivity/issues)
- ❤️ [Support Johannes directly](https://github.com/sponsors/johannesjo)

---

## License

Same as upstream — [MIT](LICENSE).
