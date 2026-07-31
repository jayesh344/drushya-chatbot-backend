// Drushya Digital India — Chatbot Backend
// This tiny server does ONE job: it receives chat messages from the
// frontend widget, calls the Anthropic API using a secret key that
// lives only on the server (never in the browser), and sends the
// reply back. This is what makes the chatbot safe to put on a real
// website or send around as a link.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set. Add it as an environment variable before starting the server.');
  process.exit(1);
}

app.use(cors()); // during setup allow all origins; see README to restrict this to your real domain
app.use(express.json({ limit: '10mb' })); // 10mb so an attached image can pass through

// ---- basic abuse protection ----
// Max 30 chat requests per IP every 15 minutes. Tune as needed.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Please try again in a few minutes, or WhatsApp us at +91 9673575452.' }
});

const SYSTEM_PROMPT_FALLBACK_NOTE = 'System prompt is sent by the frontend so the knowledge base only needs to be edited in one place (the HTML file). The backend just forwards it.';

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { system, messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    if (messages.length > 40) {
      return res.status(400).json({ error: 'Conversation too long for this endpoint.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: system || '',
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Upstream API error' });
    }

    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Drushya chatbot backend running on port ${PORT}`);
});
