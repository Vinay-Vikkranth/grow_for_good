// ─── PlantMap Configuration ───────────────────────────────────────────────
// 1. Copy this file and rename it to config.js
// 2. Fill in your tokens below
// 3. Open index.html in a browser

window.PLANTMAP_CONFIG = {
  MAPBOX_TOKEN:    'pk.eyJ1...your-mapbox-token-here',   // https://account.mapbox.com
  ANTHROPIC_KEY:   '',                                    // https://console.anthropic.com — leave empty to use Ollama
  ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
  OLLAMA_URL:      'http://localhost:11434',              // default Ollama port (fallback)
  OLLAMA_MODEL:    'llava',                               // ollama pull llava
};