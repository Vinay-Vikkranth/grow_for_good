#!/bin/bash
# Vercel build script — injects environment variables into config.js
# Runs before Vercel serves the static files

cat > config.js << EOF
window.PLANTMAP_CONFIG = {
  MAPBOX_TOKEN: '${MAPBOX_TOKEN}',
  BACKEND_URL:  '${BACKEND_URL}',
  OLLAMA_URL:   'http://localhost:11434',
  OLLAMA_MODEL: 'llava',
};
EOF

echo "config.js generated successfully"
