// Drushya Digital India — Chatbot Backend (Google Gemini version)
// This tiny server does ONE job: it receives chat messages from the
// frontend widget, calls the Google Gemini API (FREE tier, no credit
// card needed) using a secret key that lives only on the server
// (never in the browser), and sends the reply back in the same shape
// the frontend already expects.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash'; // free-tier model

if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set. Add it as an environment variable before starting the server.');
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

// Convert the Anthropic-style { role, content } messages the frontend
// sends into Gemini's { role, parts } format.
function toGeminiContents(messages) {
  return messages.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    let parts = [];

    if (typeof m.content === 'string') {
      parts.push({ text: m.content });
    } else if (Array.isArray(m.content)) {
      m.content.forEach(block => {
        if (block.type === 'text') {
          parts.push({ text: block.text });
        } else if (block.type === 'image' && block.source) {
          parts.push({
            inline_data: {
              mime_type: block.source.media_type,
              data: block.source.data
            }
          });
        }
      });
    }
    return { role, parts };
  });
}

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { system, messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    if (messages.length > 40) {
      return res.status(400).json({ error: 'Conversation too long for this endpoint.' });
    }

    const geminiBody = {
      contents: toGeminiContents(messages),
      systemInstruction: { parts: [{ text: system || '' }] },
      generationConfig: { maxOutputTokens: 1000 }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Upstream API error' });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || "Sorry, I couldn't process that.";

    // Return in the same shape the frontend already parses
    // ({ content: [{ type: 'text', text: '...' }] }) so the HTML file
    // needs no changes beyond the BACKEND_URL.
    res.json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Drushya chatbot backend (Gemini) running on port ${PORT}`);
});
