'use strict';

/**
 * Private QuickML adapter for CrimeSight AI.
 *
 * The browser calls this Catalyst function, never the QuickML endpoint. Keep
 * QUICKML_AUTH_HEADER_VALUE in Catalyst Function environment variables only.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://crimesight-dep-onmoxbpk.onslate.in')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const MAX_BODY_BYTES = 16_384;
const SYSTEM_PROMPT = 'You are CrimeSight AI, a concise conversational guide for a synthetic Karnataka police intelligence prototype. Explain product capabilities and safeguards. Never claim access to live police data, never make enforcement decisions, and direct FIR-specific questions to the verified FIR query interface.';

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Request body must be valid JSON.')); }
    });
    req.on('error', reject);
  });
}

function text(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function messagesFrom(body) {
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const item of history) {
    const content = text(item?.content, 1_000);
    const role = item?.role === 'ai' ? 'assistant' : item?.role === 'user' ? 'user' : '';
    if (content && role) messages.push({ role, content });
  }
  messages.push({ role: 'user', content: text(body.message, 1_000) });
  return messages;
}

function extractReply(payload) {
  const candidate = payload?.reply
    ?? payload?.output
    ?? payload?.response
    ?? payload?.message?.content
    ?? payload?.choices?.[0]?.message?.content
    ?? payload?.choices?.[0]?.text
    ?? payload?.data?.reply
    ?? payload?.data?.output;
  return typeof candidate === 'string' ? candidate.trim().slice(0, 4_000) : '';
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

  const endpoint = text(process.env.QUICKML_ENDPOINT, 2_000);
  const authHeaderName = text(process.env.QUICKML_AUTH_HEADER_NAME, 100) || 'Authorization';
  const authHeaderValue = text(process.env.QUICKML_AUTH_HEADER_VALUE, 5_000);
  const orgHeaderName = text(process.env.QUICKML_ORG_HEADER_NAME, 100);
  const orgHeaderValue = text(process.env.QUICKML_ORG_HEADER_VALUE, 500);

  if (!endpoint || !authHeaderValue) {
    return send(res, 503, { error: 'QuickML conversation service is not configured.', code: 'QUICKML_NOT_CONFIGURED' });
  }

  try {
    const body = await readJson(req);
    const message = text(body.message, 1_000);
    if (!message) return send(res, 400, { error: 'A message is required.' });

    const headers = { 'Content-Type': 'application/json', [authHeaderName]: authHeaderValue };
    if (orgHeaderName && orgHeaderValue) headers[orgHeaderName] = orgHeaderValue;

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: messagesFrom(body), temperature: 0.2, max_tokens: 400 }),
      signal: AbortSignal.timeout(15_000),
    });
    const raw = await upstream.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { /* preserve safe generic failure below */ }
    const reply = upstream.ok ? extractReply(payload) : '';

    if (!reply) {
      console.error('[quickml-conversation] upstream response', upstream.status, raw.slice(0, 500));
      return send(res, 502, { error: 'QuickML did not return a usable conversation response.', code: 'QUICKML_UPSTREAM_UNAVAILABLE' });
    }

    return send(res, 200, { reply, provider: 'zoho-quickml' });
  } catch (error) {
    console.error('[quickml-conversation]', error instanceof Error ? error.message : 'Unknown error');
    return send(res, 503, { error: 'QuickML conversation service is temporarily unavailable.', code: 'QUICKML_UNAVAILABLE' });
  }
};
