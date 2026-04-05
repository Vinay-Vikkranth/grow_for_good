const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'Grow For Good API' });
});

// ── /api/generate — Ollama-compatible endpoint backed by Claude ───────────
// The frontend calls this exactly like Ollama: { model, prompt, images, stream, options }
// We translate it into an Anthropic /v1/messages call server-side.
app.post('/api/generate', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_KEY not configured on server' });
  }

  const { prompt, images = [], options = {} } = req.body;
  const model      = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  const max_tokens = options.num_predict || 1024;

  // Build message content — include image if provided
  const content = [];
  if (images && images.length > 0) {
    content.push({
      type: 'image',
      source: {
        type:       'base64',
        media_type: 'image/jpeg',
        data:       images[0],   // base64, no data-URI prefix (matches how frontend sends it)
      },
    });
  }
  content.push({ type: 'text', text: prompt });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [{ role: 'user', content }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[/api/generate] Anthropic error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    // Return in Ollama-compatible format so the frontend needs no changes
    const text = data.content?.[0]?.text || '';
    res.json({ response: text, done: true });

  } catch (err) {
    console.error('[/api/generate] fetch error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── /api/chat — direct Anthropic proxy (used by plantmap/index.html) ──────
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_KEY not configured on server' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    console.error('[/api/chat] error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Grow For Good backend running on port ${PORT}`);
});
