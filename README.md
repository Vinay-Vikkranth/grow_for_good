# Grow For Good 🌳

Carbon-first tree planting web app — Mapbox GL JS + Three.js + Claude AI vision.

Upload a soil photo, answer a few adaptive questions, and get AI-powered plant recommendations ranked by **carbon sequestration potential**.

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/Vinay-Vikkranth/grow_for_good.git
cd grow_for_good/plantmap
```

### 2. Configure API keys

```bash
cp config.example.js config.js
```

Edit `config.js`:

```js
window.PLANTMAP_CONFIG = {
  MAPBOX_TOKEN:    'pk.eyJ1...YOUR_TOKEN_HERE',   // https://account.mapbox.com
  ANTHROPIC_KEY:   'sk-ant-api03-...',             // https://console.anthropic.com
  ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
  OLLAMA_URL:      'http://localhost:11434',       // fallback if no Anthropic key
  OLLAMA_MODEL:    'llava',
};
```

| Key | Required | Source |
|-----|----------|--------|
| `MAPBOX_TOKEN` | Yes | [mapbox.com](https://account.mapbox.com) → Tokens |
| `ANTHROPIC_KEY` | Recommended | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| Ollama | Optional fallback | [ollama.com](https://ollama.com) — `ollama pull llava && ollama serve` |

### 3. Open in browser

Open `plantmap/index.html` — no server, no npm, no build step needed.

---

## Features

### Core
- 🌍 Cinematic 3D globe with auto-rotation, fog, and stars
- 📍 GPS geolocation or city search with fly-to animation
- 🏙️ 3D buildings + terrain at street level
- 🟢 Satellite-detected planting zones with pulsing polygons
- 🌳 3D procedural trees placed on map with grow animation
- 🎨 Light / Dark theme toggle

### AI Soil Analysis
- 📸 Photo upload → Claude vision API analyses soil type, pH, drainage, moisture, texture
- 🔬 Colour index extraction (RI, CI, HI, SI) based on Taneja et al. 2022 (CJSS) research
- 🤖 Falls back to local Ollama (llava) if no Anthropic key is set

### Adaptive Questionnaire
- 🧠 Dynamic questions that change based on your answers:
  - Goal → follow-up (food types, garden style, wildlife, shade purpose, screening)
  - Space → adjusts effort vs time+maintenance questions
  - Food goal → growing preferences; other goals → plant type preferences
- 🌿 Carbon reduction is **always prioritised** — not an option, it's the default

### Plant Recommendations
- 🌱 5 plants ranked by **CO₂ capture per year** (highest first)
- 💰 Estimated cost, maintenance level, time to maturity
- 🧬 Soil match explanation for each plant
- 📍 Click to place 3D tree on the map

### Weather Integration
- ⛅ Real-time weather from Open-Meteo (past 7 + forecast 7 days)
- 🌡️ Smart planting advice: frost warnings, heat advisories, night/day detection
- 🌧️ Severe weather alerts that recommend waiting

---

## How It Works

```
Globe spins → GPS / search → Fly to your location →
Satellite zones detected → Click a zone → Upload soil photo →
Answer adaptive questions → Claude analyses soil + preferences →
5 plant recommendations (carbon-first) → Place 3D trees on map
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Vanilla HTML/CSS/JS | Single-file app, no build step |
| Mapbox GL JS v3.2.0 | 3D globe, satellite tiles, terrain, geocoding |
| Three.js r158 | Procedural 3D tree rendering |
| Anthropic Claude API | Vision-based soil analysis + plant recommendations |
| Open-Meteo API | Weather data + planting advisories |
| Ollama (optional) | Local AI fallback (llava) |

---

## File Structure

```
plantmap/
├── index.html          ← Entire app (HTML + CSS + JS)
├── config.example.js   ← Template — copy to config.js
├── config.js           ← Your local config (gitignored)
├── README.md
└── assets/
    ├── bgm.mp3         ← Background music
    └── icons/
        ├── leaf.svg
        └── logo.svg
```
