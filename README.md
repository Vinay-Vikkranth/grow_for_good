# PlantMap 🌳

Interactive 3D tree-planting web app — Mapbox GL JS + Three.js + Ollama (local AI vision).

**No API keys, no cloud, no cost** — AI runs entirely on your machine via Ollama.

---

## Quick Start

### 1. Install Ollama (local AI runner)

Download from **[ollama.com](https://ollama.com)** and install it.

Then pull a vision model (one-time, ~4 GB):

```bash
ollama pull llava
```

Start the Ollama server (runs in background):

```bash
ollama serve
```

### 2. Add your Mapbox token to `index.html`

Open [index.html](index.html) and find the `CONFIG` block near the bottom:

```js
const CONFIG = {
  MAPBOX_TOKEN: 'pk.eyJ1...REPLACE_ME',   // ← only this needs changing
  OLLAMA_URL:   'http://localhost:11434',
  OLLAMA_MODEL: 'llava',
};
```

Get a free Mapbox token at **[mapbox.com](https://account.mapbox.com)** → Tokens → Create a token.

### 3. Open in browser

Double-click `index.html` — no server, no npm, no build step needed.

---

## Vision Models (choose in CONFIG)

| Model | Size | Notes |
|-------|------|-------|
| `llava` | ~4 GB | Best general vision quality |
| `llava-phi3` | ~2.9 GB | Smaller, faster |
| `moondream` | ~1.7 GB | Very fast, lightweight |
| `bakllava` | ~4.1 GB | Alternative llava variant |

To switch: change `OLLAMA_MODEL` in the CONFIG block and pull the model first:
```bash
ollama pull moondream
```

---

## Features

- 🌍 Cinematic 3D globe with auto-rotation, fog, and stars
- 📍 GPS or city-search fly-to animation
- 🏙️ 3D buildings + terrain at street level
- 🟢 Pulsing planting-zone polygons on the map
- 📸 Photo upload → local AI (llava) soil analysis — **no internet needed**
- 🌳 3D procedural trees placed on the map with grow animation
- 🔁 Reset back to globe any time

---

## Deploying

For local use: just open `index.html` directly.

For sharing online (Netlify/Vercel): the Ollama call will fail since it's `localhost`.
In that case, either:
- Run a small Express/FastAPI proxy server that forwards to Ollama, or
- Swap the fetch URL to point to your server's IP

---

## File structure

```
plantmap/
├── index.html          ← Entire app (HTML + CSS + JS)
├── assets/
│   ├── icons/
│   │   ├── leaf.svg
│   │   └── logo.svg
│   └── models/         ← Optional: drop .glb tree models here
└── README.md
```
