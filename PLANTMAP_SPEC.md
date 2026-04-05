# 🌳 PlantMap — Interactive 3D Tree Planting Web App
## Complete Build Specification

---

## 1. Project Overview

**PlantMap** is an interactive, map-based web application that helps everyday users discover where they can legally plant trees near their location. It uses a cinematic 3D globe experience, AI-powered soil analysis via photo upload, and Three.js-powered 3D plant visualization to guide users from discovery to action.

### Core User Journey
```
Land on site → Globe spins → Grant location → 
Cinematic zoom to your city → See highlighted planting zones → 
Click a zone → Upload soil photo → AI analyzes it → 
Tree species recommended → 3D plant placed on map → 
User gets action plan
```

---

## 2. Tech Stack

### Frontend
| Tool | Purpose | Version |
|---|---|---|
| **Vanilla HTML/CSS/JS** | Single-file web app, no build step | ES2022 |
| **Mapbox GL JS** | 3D globe, fly-to, terrain, building layers | v3.x |
| **Three.js** | 3D plant model rendering on map canvas | r158+ |
| **GLTFLoader** (Three.js addon) | Load `.glb` plant models | r158+ |
| **Mapbox Custom Layer** | Bridge Three.js scene into Mapbox canvas | Built-in |
| **Google Fonts** | Typography | CDN |

### Backend / APIs
| Service | Purpose |
|---|---|
| **Anthropic Claude API** (`claude-sonnet-4-20250514`) | Soil image analysis, tree recommendation |
| **Mapbox API** | Map tiles, geocoding, terrain, 3D buildings |
| **Browser Geolocation API** | User's GPS coordinates |

### Data Sources
| Source | Data |
|---|---|
| **OpenStreetMap via Mapbox** | Park boundaries, public land |
| **Hardcoded GeoJSON (MVP)** | Plantable zone polygons |
| **USDA Hardiness Zone data** | Plant species by region |
| **Arbor Day Foundation** | Tree species info (linked externally) |

---

## 3. File Structure

```
plantmap/
├── index.html          ← Entire app lives here (single file)
├── assets/
│   ├── models/
│   │   ├── oak.glb           ← 3D tree model (GLTF binary)
│   │   ├── pine.glb
│   │   ├── maple.glb
│   │   └── sapling.glb       ← Generic fallback
│   └── icons/
│       ├── leaf.svg
│       └── logo.svg
└── README.md
```

> **Important:** For hackathon/MVP, everything (HTML, CSS, JS) goes in `index.html`. No bundler, no npm, no build step. Just open in browser or deploy to Netlify/Vercel by drag-drop.

---

## 4. index.html — Complete Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Meta, fonts, Mapbox CSS -->
</head>
<body>
  <!-- Layer 1: Full-screen Mapbox canvas -->
  <div id="map"></div>

  <!-- Layer 2: Intro overlay (shown on load) -->
  <div id="intro-overlay">...</div>

  <!-- Layer 3: Location permission prompt -->
  <div id="location-prompt">...</div>

  <!-- Layer 4: Zone detail sidebar (shown on zone click) -->
  <div id="zone-sidebar">...</div>

  <!-- Layer 5: Soil upload modal -->
  <div id="soil-modal">...</div>

  <!-- Layer 6: AI result panel -->
  <div id="ai-result-panel">...</div>

  <!-- Layer 7: Top nav bar -->
  <nav id="topbar">...</nav>

  <!-- Scripts: Mapbox, Three.js, app logic -->
</body>
</html>
```

---

## 5. CDN Imports (No npm Required)

Paste these in `<head>` and before `</body>`:

```html
<!-- Mapbox GL JS -->
<link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>

<!-- Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js"></script>

<!-- Three.js GLTFLoader (ES module import map) -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/"
  }
}
</script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
```

---

## 6. Map Initialization

### 6.1 Globe View on Load

```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  projection: 'globe',        // ← enables 3D globe
  zoom: 1.5,
  center: [0, 20],            // start centered on Earth
  pitch: 0,
  bearing: 0,
  antialias: true             // smoother Three.js rendering
});

// Auto-rotate globe on load
let rotationInterval;
function startGlobeRotation() {
  rotationInterval = setInterval(() => {
    const center = map.getCenter();
    map.setCenter([center.lng + 0.3, center.lat]);
  }, 50);
}
startGlobeRotation();
```

### 6.2 Add Atmosphere and Stars

```javascript
map.on('style.load', () => {
  map.setFog({
    color: 'rgb(10, 20, 40)',
    'high-color': 'rgb(30, 60, 120)',
    'horizon-blend': 0.02,
    'space-color': 'rgb(2, 5, 15)',
    'star-intensity': 0.8         // ← shows stars on globe
  });

  map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14
  });

  map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 }); // 3D terrain
});
```

---

## 7. Location Flow

### 7.1 Ask for Permission

Show a styled modal on load with a CTA button:

```html
<div id="location-prompt" class="overlay-panel">
  <div class="globe-icon">🌍</div>
  <h1>Find Your Planting Spot</h1>
  <p>We'll zoom into your location and show you where you can plant trees today.</p>
  <button id="allow-location-btn">📍 Allow Location Access</button>
  <button id="search-location-btn">🔍 Search a City Instead</button>
</div>
```

### 7.2 Fly-To Animation (The Cinematic Zoom)

```javascript
document.getElementById('allow-location-btn').addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { longitude, latitude } = pos.coords;
    
    // Stop globe rotation
    clearInterval(rotationInterval);

    // Hide prompt
    document.getElementById('location-prompt').classList.add('hidden');

    // Phase 1: zoom from globe to continent level
    map.flyTo({
      center: [longitude, latitude],
      zoom: 5,
      pitch: 20,
      duration: 2000,
      essential: true
    });

    // Phase 2: after 2s, dive into street level
    setTimeout(() => {
      map.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        pitch: 62,
        bearing: -20,
        duration: 3500,
        essential: true
      });

      // After landing, load planting zones
      setTimeout(() => loadPlantingZones(longitude, latitude), 3500);
    }, 2200);

  }, () => {
    alert('Location access denied. Try searching a city.');
  });
});
```

---

## 8. 3D City View

### 8.1 Enable 3D Buildings

```javascript
function enable3DBuildings() {
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
      'fill-extrusion-color': '#1a2035',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.85
    }
  });
}
```

---

## 9. Planting Zones

### 9.1 GeoJSON Structure (MVP — Hardcode Near User)

```javascript
function generateMockZones(lng, lat) {
  // Generate 5–8 fake plantable zone polygons around user
  const zones = [];
  const offsets = [
    [0.001, 0.001], [-0.002, 0.001], [0.0015, -0.001],
    [-0.001, -0.0015], [0.003, 0.0005]
  ];
  offsets.forEach((offset, i) => {
    const clng = lng + offset[0];
    const clat = lat + offset[1];
    const size = 0.0004;
    zones.push({
      type: 'Feature',
      properties: {
        id: i,
        name: ['City Park Strip', 'Sidewalk Tree Pit', 'Community Garden', 
               'Vacant Lot', 'Median Planting Zone'][i % 5],
        type: ['public_park', 'sidewalk', 'community', 'vacant', 'median'][i % 5],
        permit_required: [false, true, false, true, true][i % 5],
        soil_type: ['Loamy', 'Clay', 'Sandy', 'Silty', 'Rocky'][i % 5],
        sun_exposure: ['Full Sun', 'Partial Shade', 'Full Shade'][i % 3],
        best_season: 'Spring / Fall'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [clng - size, clat - size],
          [clng + size, clat - size],
          [clng + size, clat + size],
          [clng - size, clat + size],
          [clng - size, clat - size]
        ]]
      }
    });
  });
  return { type: 'FeatureCollection', features: zones };
}
```

### 9.2 Render Zones on Map

```javascript
function loadPlantingZones(lng, lat) {
  const zonesGeoJSON = generateMockZones(lng, lat);

  map.addSource('planting-zones', {
    type: 'geojson',
    data: zonesGeoJSON
  });

  // Fill layer — glowing green
  map.addLayer({
    id: 'zones-fill',
    type: 'fill',
    source: 'planting-zones',
    paint: {
      'fill-color': [
        'match', ['get', 'type'],
        'public_park', '#22c55e',
        'sidewalk', '#84cc16',
        'community', '#10b981',
        'vacant', '#f59e0b',
        'median', '#06b6d4',
        '#22c55e'
      ],
      'fill-opacity': 0.45
    }
  });

  // Outline layer — bright
  map.addLayer({
    id: 'zones-outline',
    type: 'line',
    source: 'planting-zones',
    paint: {
      'line-color': '#4ade80',
      'line-width': 2.5,
      'line-blur': 1
    }
  });

  // Pulse animation via opacity oscillation
  let opacity = 0.45;
  let growing = false;
  setInterval(() => {
    opacity = growing ? opacity + 0.01 : opacity - 0.01;
    if (opacity >= 0.6) growing = false;
    if (opacity <= 0.3) growing = true;
    map.setPaintProperty('zones-fill', 'fill-opacity', opacity);
  }, 50);

  // Click handler
  map.on('click', 'zones-fill', (e) => {
    const props = e.features[0].properties;
    const coords = e.lngLat;
    openZoneSidebar(props, coords);
  });

  // Cursor pointer on hover
  map.on('mouseenter', 'zones-fill', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'zones-fill', () => map.getCanvas().style.cursor = '');
}
```

---

## 10. Zone Sidebar (Click a Zone)

### 10.1 HTML Panel

```html
<div id="zone-sidebar" class="sidebar hidden">
  <button id="close-sidebar">✕</button>
  <div class="zone-badge" id="zone-type-badge">Public Park</div>
  <h2 id="zone-name">City Park Strip</h2>

  <div class="zone-meta-grid">
    <div class="meta-card">
      <span class="label">Soil</span>
      <span id="meta-soil">Loamy</span>
    </div>
    <div class="meta-card">
      <span class="label">Sun</span>
      <span id="meta-sun">Full Sun</span>
    </div>
    <div class="meta-card">
      <span class="label">Permit</span>
      <span id="meta-permit">Not Required</span>
    </div>
    <div class="meta-card">
      <span class="label">Best Season</span>
      <span id="meta-season">Spring / Fall</span>
    </div>
  </div>

  <div class="divider"></div>

  <h3>📸 Analyze Soil with AI</h3>
  <p class="subtitle">Upload a photo of this spot and our AI will recommend the perfect tree.</p>

  <div id="upload-zone" class="upload-dropzone">
    <input type="file" id="soil-photo-input" accept="image/*" hidden>
    <div class="upload-inner">
      <span class="upload-icon">🌱</span>
      <p>Tap to upload photo or take one now</p>
    </div>
  </div>

  <button id="analyze-btn" class="cta-btn hidden">🔍 Analyze & Recommend</button>

  <div id="ai-loading" class="hidden">
    <div class="loader-bar"></div>
    <p>AI is analyzing your soil...</p>
  </div>
</div>
```

### 10.2 JavaScript

```javascript
function openZoneSidebar(props, coords) {
  document.getElementById('zone-name').textContent = props.name;
  document.getElementById('zone-type-badge').textContent = props.type.replace('_', ' ');
  document.getElementById('meta-soil').textContent = props.soil_type;
  document.getElementById('meta-sun').textContent = props.sun_exposure;
  document.getElementById('meta-permit').textContent = props.permit_required ? '⚠️ Required' : '✅ Not Required';
  document.getElementById('meta-season').textContent = props.best_season;

  // Store current zone coords for 3D plant placement later
  window.selectedZoneCoords = coords;

  document.getElementById('zone-sidebar').classList.remove('hidden');
  document.getElementById('zone-sidebar').classList.add('slide-in');
}
```

---

## 11. Soil Photo Upload + Claude AI Analysis

### 11.1 File Input Handler

```javascript
const fileInput = document.getElementById('soil-photo-input');
const uploadZone = document.getElementById('upload-zone');
let selectedImageBase64 = null;

uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    selectedImageBase64 = ev.target.result.split(',')[1]; // strip data:image/...;base64,
    
    // Show preview
    uploadZone.innerHTML = `<img src="${ev.target.result}" style="width:100%;border-radius:12px;">`;
    
    // Show analyze button
    document.getElementById('analyze-btn').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});
```

### 11.2 Claude API Call (Soil Analysis)

```javascript
document.getElementById('analyze-btn').addEventListener('click', async () => {
  if (!selectedImageBase64) return;

  document.getElementById('ai-loading').classList.remove('hidden');
  document.getElementById('analyze-btn').classList.add('hidden');

  const prompt = `You are a professional urban forester and soil scientist.

Analyze this image of a planting location. Based on what you can observe:

1. Identify the likely soil type (clay, loam, sand, silt, rocky, etc.)
2. Estimate moisture level (dry, moderate, moist)
3. Assess sunlight conditions visible in the image
4. Recommend exactly 3 tree species suitable for urban planting in temperate US climates that would thrive here
5. For each species provide: common name, scientific name, expected height, growth rate, and one care tip

Return ONLY a JSON object in this exact format, no markdown, no extra text:
{
  "soil_type": "...",
  "moisture": "...",
  "sunlight": "...",
  "location_notes": "one sentence about what you see",
  "recommendations": [
    {
      "common_name": "...",
      "scientific_name": "...",
      "height": "...",
      "growth_rate": "...",
      "care_tip": "...",
      "model": "oak"
    }
  ]
}

For the "model" field, choose the closest match from: oak, pine, maple, sapling`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: selectedImageBase64
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    document.getElementById('ai-loading').classList.add('hidden');
    renderAIResults(result);

  } catch (err) {
    console.error('AI analysis failed:', err);
    document.getElementById('ai-loading').classList.add('hidden');
    alert('Analysis failed. Check your API key or try again.');
  }
});
```

### 11.3 Render AI Results

```javascript
function renderAIResults(data) {
  const panel = document.getElementById('ai-result-panel');
  
  panel.innerHTML = `
    <div class="result-header">
      <h2>🌿 AI Soil Analysis</h2>
      <div class="soil-stats">
        <span class="stat-chip">🪨 ${data.soil_type}</span>
        <span class="stat-chip">💧 ${data.moisture}</span>
        <span class="stat-chip">☀️ ${data.sunlight}</span>
      </div>
      <p class="location-note">${data.location_notes}</p>
    </div>

    <h3>Recommended Trees</h3>
    <div class="tree-cards">
      ${data.recommendations.map((tree, i) => `
        <div class="tree-card" onclick="selectTree(${i}, '${tree.model}')">
          <div class="tree-number">${i + 1}</div>
          <div class="tree-info">
            <h4>${tree.common_name}</h4>
            <em>${tree.scientific_name}</em>
            <div class="tree-meta">
              <span>📏 ${tree.height}</span>
              <span>⚡ ${tree.growth_rate} growth</span>
            </div>
            <p class="care-tip">💡 ${tree.care_tip}</p>
          </div>
          <button class="plant-btn">🌱 Place on Map</button>
        </div>
      `).join('')}
    </div>
  `;

  panel.classList.remove('hidden');
  panel.classList.add('fade-in');

  // Store for 3D planting
  window.aiRecommendations = data.recommendations;
}

function selectTree(index, modelName) {
  const tree = window.aiRecommendations[index];
  const coords = window.selectedZoneCoords;
  place3DTree(coords.lng, coords.lat, modelName, tree.common_name);
}
```

---

## 12. Three.js 3D Plant Placement on Map

This is the most technically complex part. Mapbox allows injecting a Three.js scene as a **Custom Layer** that renders on the same WebGL context.

### 12.1 Coordinate Conversion Helper

```javascript
// Convert lng/lat to Mapbox mercator coordinates for Three.js
function lngLatToWorld(lng, lat) {
  const mercator = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, 0);
  return mercator;
}
```

### 12.2 Three.js Custom Layer Setup

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const placedTrees = []; // track all placed trees

function place3DTree(lng, lat, modelName, displayName) {
  const modelOrigin = [lng, lat];
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
    modelOrigin, modelAltitude
  );

  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * 15
  };

  const layerId = `3d-tree-${Date.now()}`;

  const customLayer = {
    id: layerId,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffd700, 1.2);
      dirLight.position.set(0, -70, 100).normalize();
      this.scene.add(dirLight);

      // Load GLTF model
      const loader = new GLTFLoader();
      loader.load(`assets/models/${modelName}.glb`, (gltf) => {
        const model = gltf.scene;

        // Grow animation: start tiny, scale up
        model.scale.set(0.01, 0.01, 0.01);
        this.scene.add(model);

        let scaleProgress = 0;
        const growInterval = setInterval(() => {
          scaleProgress += 0.03;
          const s = Math.min(scaleProgress, 1);
          const eased = s < 0.5 ? 2 * s * s : -1 + (4 - 2 * s) * s; // ease in-out
          model.scale.set(eased, eased, eased);
          map.triggerRepaint();
          if (scaleProgress >= 1) clearInterval(growInterval);
        }, 20);
      });

      this.map = map;
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },

    render(gl, matrix) {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0), modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0), modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1), modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(new THREE.Vector3(
          modelTransform.scale,
          -modelTransform.scale,
          modelTransform.scale
        ))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    }
  };

  map.addLayer(customLayer);
  placedTrees.push({ layerId, lng, lat, name: displayName });

  // Show confirmation toast
  showToast(`🌳 ${displayName} planted! ${placedTrees.length} tree(s) placed today.`);
}
```

---

## 13. CSS Design System

```css
/* ─── Design Tokens ─── */
:root {
  --bg-dark:        #060d15;
  --bg-panel:       #0d1a26cc;   /* semi-transparent */
  --bg-card:        #112233;
  --green-primary:  #22c55e;
  --green-glow:     #4ade8088;
  --green-soft:     #86efac;
  --accent-gold:    #f59e0b;
  --text-primary:   #e2f5e9;
  --text-muted:     #64748b;
  --border:         #1e3a2a;
  --font-display:   'Syne', sans-serif;
  --font-body:      'DM Sans', sans-serif;
  --radius:         16px;
  --shadow:         0 8px 32px rgba(34, 197, 94, 0.15);
}

/* ─── Global Reset ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { 
  font-family: var(--font-body); 
  background: var(--bg-dark); 
  color: var(--text-primary); 
  overflow: hidden; 
}

/* ─── Map Full Screen ─── */
#map { position: fixed; inset: 0; width: 100vw; height: 100vh; }

/* ─── Overlays ─── */
.overlay-panel {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #071525ee 0%, #020810ff 100%);
  z-index: 100;
  gap: 20px;
  padding: 40px;
  text-align: center;
  transition: opacity 0.5s ease;
}
.overlay-panel.hidden { opacity: 0; pointer-events: none; }

.overlay-panel h1 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, #22c55e, #86efac);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ─── Sidebar ─── */
#zone-sidebar {
  position: fixed;
  top: 0; right: -420px;
  width: 400px; height: 100vh;
  background: var(--bg-panel);
  backdrop-filter: blur(20px);
  border-left: 1px solid var(--border);
  z-index: 50;
  overflow-y: auto;
  padding: 32px 28px;
  transition: right 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
#zone-sidebar.slide-in { right: 0; }

/* ─── AI Result Panel ─── */
#ai-result-panel {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  max-height: 60vh;
  background: var(--bg-panel);
  backdrop-filter: blur(24px);
  border-top: 1px solid var(--border);
  z-index: 60;
  overflow-y: auto;
  padding: 28px 32px;
  border-radius: var(--radius) var(--radius) 0 0;
  transform: translateY(100%);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
#ai-result-panel.fade-in { transform: translateY(0); }

/* ─── Tree Cards ─── */
.tree-cards { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }

.tree-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.tree-card:hover {
  border-color: var(--green-primary);
  box-shadow: var(--shadow);
}

.tree-number {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--green-primary);
  color: #000;
  font-weight: 800;
  font-family: var(--font-display);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ─── CTA Button ─── */
.cta-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #000;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 16px;
}
.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
}

/* ─── Upload Zone ─── */
.upload-dropzone {
  border: 2px dashed var(--green-primary);
  border-radius: var(--radius);
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
}
.upload-dropzone:hover { background: rgba(34, 197, 94, 0.05); }

/* ─── Loader ─── */
.loader-bar {
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--green-primary), transparent);
  border-radius: 2px;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ─── Toast ─── */
.toast {
  position: fixed;
  bottom: 32px; left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--green-primary);
  color: #000;
  font-weight: 700;
  padding: 14px 28px;
  border-radius: 50px;
  z-index: 999;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.toast.show { transform: translateX(-50%) translateY(0); }

/* ─── Stat Chips ─── */
.stat-chip {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--green-primary);
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.8rem;
  color: var(--green-soft);
}

/* ─── Utility ─── */
.hidden { display: none !important; }
```

---

## 14. Toast Notification

```javascript
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
```

---

## 15. Top Navigation Bar

```html
<nav id="topbar">
  <div class="nav-logo">
    🌳 <span>PlantMap</span>
  </div>
  <div class="nav-stats">
    <span id="trees-planted-count">0 trees placed</span>
  </div>
  <button id="reset-btn" onclick="resetToGlobe()">🌍 New Location</button>
</nav>
```

```css
#topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(6, 13, 21, 0.8);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  z-index: 40;
}

.nav-logo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--green-primary);
}
```

---

## 16. GLTF Models — Where to Get Them Free

1. **Sketchfab** → filter by free, CC license → search "tree low poly"
2. **Poly Pizza** (polypizza.com) → free GLTF/GLB assets
3. **Google Model Viewer samples** → tree samples in GLB
4. **KhronosGroup GLTF samples** → github.com/KhronosGroup/glTF-Sample-Models

> For hackathon/MVP, use **one simple sapling GLB** for all species. Swap out later for species-specific models.

Quick fallback: replace GLB with a **Three.js procedural tree**:

```javascript
function createProceduralTree() {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 8);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b3a2a });
  group.add(new THREE.Mesh(trunkGeo, trunkMat));

  // Canopy layers
  [1.5, 2.2, 2.8].forEach((y, i) => {
    const r = 1.2 - i * 0.3;
    const leafGeo = new THREE.ConeGeometry(r, 1.2, 8);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const cone = new THREE.Mesh(leafGeo, leafMat);
    cone.position.y = y;
    group.add(cone);
  });

  return group;
}
```

---

## 17. Environment Variables

Create a `.env.js` file or inline in index.html:

```javascript
const CONFIG = {
  MAPBOX_TOKEN: 'pk.eyJ1...',         // get from mapbox.com
  ANTHROPIC_API_KEY: 'sk-ant-...',    // get from console.anthropic.com
  APP_VERSION: '1.0.0'
};
```

> ⚠️ **For hackathon only** — hardcode tokens in frontend. For production, move Claude API calls to a backend proxy to protect keys.

---

## 18. Full Application State Object

```javascript
const AppState = {
  phase: 'globe',          // globe | flying | city | zone_selected | analyzing | results
  userLocation: null,      // { lng, lat }
  selectedZone: null,      // GeoJSON feature properties
  selectedZoneCoords: null,// { lng, lat }
  uploadedImageB64: null,  // base64 string
  aiResults: null,         // parsed Claude response
  placedTrees: [],         // array of placed tree objects
  mapReady: false          // true after map loads
};
```

---

## 19. Deployment (1-Click)

### Option A: Netlify Drop
1. Create folder with `index.html` + `assets/`
2. Go to **netlify.com/drop**
3. Drag-drop the folder
4. Live URL in 30 seconds ✅

### Option B: GitHub Pages
```bash
git init
git add .
git commit -m "PlantMap v1"
gh repo create plantmap --public --push
# Enable Pages in repo settings → Deploy from main → / root
```

### Option C: Vercel
```bash
npx vercel --prod
```

---

## 20. Build Phases (Recommended Order)

| Phase | Task | Est. Time |
|---|---|---|
| **0** | Set up index.html shell, CDN imports, Mapbox token | 30 min |
| **1** | Globe renders, rotates, fog + stars work | 1 hr |
| **2** | Location button → fly-to animation → 3D city view | 1.5 hr |
| **3** | GeoJSON zones load and pulse on map | 1 hr |
| **4** | Click zone → sidebar slides in with zone info | 1 hr |
| **5** | File upload UI → base64 conversion | 45 min |
| **6** | Claude API call → JSON parse → render tree cards | 1.5 hr |
| **7** | Three.js custom layer → procedural tree placed on map | 2 hr |
| **8** | Replace procedural tree with GLB model + grow animation | 1.5 hr |
| **9** | CSS polish, animations, toasts, topbar | 1 hr |
| **10** | Deploy to Netlify | 15 min |

**Total: ~12–13 hours of focused work**

---

## 21. Known Gotchas

| Issue | Fix |
|---|---|
| Three.js + Mapbox WebGL context clash | Always set `renderer.autoClear = false` and call `renderer.resetState()` before render |
| Globe projection not available | Use Mapbox v3+, not v2 |
| Claude API CORS on frontend | Use a proxy or Anthropic's browser-compatible endpoint. In hackathons, direct calls usually work |
| GLB not loading | Host in same origin or enable CORS on CDN. Use `sapling.glb` from local `assets/` folder |
| Zones not visible at street zoom | Set layer `minzoom: 14` and zoom to 16 before adding zones |
| Fly-to flickers | Add `map.once('moveend', callback)` instead of `setTimeout` for chained animations |

---

## 22. Future Enhancements (Post-Hackathon)

- **Real zone data** from city open data APIs (NYC, Chicago, SF have tree pit GIS layers)
- **Species-specific 3D models** per recommendation
- **Shareable URLs** — encode planted tree coordinates in URL params
- **Community layer** — see trees other users have pledged to plant
- **Carbon offset counter** per placed tree using USDA iTree estimates
- **Mobile PWA** — make it installable on phone for on-site use
- **Permit auto-linker** — detect city from geocode → link to correct permit page

---

*Built for the PlantMap Hackathon Project | Stack: Mapbox GL JS + Three.js + Claude Vision API*
