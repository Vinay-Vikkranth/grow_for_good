#!/bin/bash
# Vercel build script — injects environment variables into config.js

cat > config.js << EOF
window.PLANTMAP_CONFIG = {
  MAPBOX_TOKEN:    '${MAPBOX_TOKEN}',
  BACKEND_URL:     '${BACKEND_URL}',
  ANTHROPIC_MODEL: 'claude-sonnet-4-20250514',
  OLLAMA_URL:      '${BACKEND_URL}',
  OLLAMA_MODEL:    'llava',
};
EOF

echo "config.js generated with BACKEND_URL=${BACKEND_URL}"
