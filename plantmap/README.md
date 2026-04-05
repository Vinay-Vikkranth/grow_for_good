# Grow For Good 🌳

Carbon-first tree planting web app — Claude AI vision + Mapbox GL JS + Three.js.

See the root [README](../README.md) for full setup and feature details.

---

## Quick Start

```bash
cp config.example.js config.js   # add your Mapbox + Anthropic keys
open index.html                  # no server needed
```

---

## Features

- 🌍 3D globe with cinematic fly-to animation
- 📸 Soil photo → Claude AI analysis (colour indices + vision)
- 🧠 Adaptive questionnaire — questions change based on your answers
- 🌿 Carbon reduction always prioritised in plant recommendations
- 🌱 5 plants ranked by CO₂ capture, matched to your soil, budget, and space
- 🌳 Place 3D procedural trees on the map
- ⛅ Real-time weather + smart planting advice
- 🎨 Light / Dark theme

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
