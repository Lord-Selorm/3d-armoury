# Burma Camp Armoury — Digital Twin

Interactive 3D armoury management system built with Three.js. Browse, inspect, check out, and track weapons in a virtual armoury environment.

## Features

- **3D Weapon Racks** — Rotate, zoom, and walk around a fully rendered armoury
- **Check Out / Inspect** — Click to check out a weapon, Ctrl+click to inspect in detail
- **Audit Log** — Every checkout is logged with timestamps (saved to browser)
- **Search** — Find weapons by rack position (e.g. `RDF`, `81S`, `SC`)
- **Statistics Dashboard** — Real-time checkout stats and exportable CSV
- **Walking Mode** — WASD + Q/E movement through the armoury
- **Preset Views** — 1–4 hotkeys for camera positions
- **Undo** — Ctrl+Z to undo last checkout
- **Wireframe Overlay** — Toggle with U

## Controls

| Action | Input |
|---|---|
| Check out gun | Left-click gun |
| Inspect gun | Ctrl+click gun |
| Orbit camera | Drag |
| Zoom | Scroll |
| Move | WASD / arrows |
| Move down/up | Q / E |
| Restore gun | Click red light |
| Restore last | Right-click rack |
| Focus rack | Click rack |
| Reset camera | Esc |
| Reset all guns | R |
| Toggle audit log | L |
| Toggle help | H / ? |
| Statistics | T |
| Wireframe | U |
| Walking mode | M |
| Search rack | / or F |
| Preset views | 1–4 |
| Undo checkout | Ctrl+Z |

## Tech Stack

- **Three.js** — 3D rendering (WebGL, CSS2DRenderer)
- **RGBELoader** — HDR environment lighting
- **GLTFLoader / FBXLoader** — Model loading
- **Vercel** — Deployment

## Project Structure

```
public/           # Frontend (index.html, style.css, script.js)
  models/         # 3D models (.glb, .fbx) and textures
server/           # Local development server
scripts/          # Conversion utilities and misc files
```

## Local Development

```bash
node server/serve.js
# → http://localhost:8000
```

## Deployment

Auto-deploys on push via Vercel.

Live: https://3d-armoury.vercel.app
