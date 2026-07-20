'use strict';

/**
 * CrimeSight governed-review API — Catalyst Advanced I/O Function.
 *
 * Data Store table required before deployment: GovernedReviewActions
 * Required columns are Catalyst Text fields; RecordedAt stores an ISO timestamp.
 * FirId, FirNumber, Decision, Actor, Rationale, EvidenceRequirement,
 * Source, CorrelationId, RecordedAt
 *
 * This function deliberately stores review decisions only. It does not make
 * policing decisions, change FIR status, or expose operational source data.
 */
const catalyst = require('zcatalyst-sdk-node');
const { randomUUID } = require('crypto');

const TABLE_NAME = process.env.GOVERNED_REVIEW_TABLE || 'GovernedReviewActions';
const ALLOWED_DECISIONS = new Set(['Approved', 'Needs evidence']);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      if (raw.length > 16_384) reject(new Error('Request body is too large.'));
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

function toAction(row) {
  return {
    id: String(row.ROWID),
    firId: row.FirId,
    fir: row.FirNumber,
    status: row.Decision,
    actor: row.Actor,
    reason: row.Rationale,
    evidenceRequirement: row.EvidenceRequirement || '',
    recordedAt: row.RecordedAt || row.CREATEDTIME,
    source: 'catalyst',
    correlationId: row.CorrelationId,
  };
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  const url = new URL(req.url, 'https://governed-review.invalid');
  if (url.pathname !== '/' && url.pathname !== '/actions') {
    return send(res, 404, { error: 'Not found.' });
  }

  try {
    // The server-side function holds the Catalyst permissions; the browser never
    // receives Data Store credentials.
    const app = catalyst.initialize(req, { scope: 'admin' });
    const table = app.datastore().table(TABLE_NAME);

    if (req.method === 'GET') {
      const { data } = await table.getPagedRows({ maxRows: 100 });
      const actions = data
        .map(toAction)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      return send(res, 200, { source: 'catalyst-data-store', actions });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

    const body = await readJson(req);
    const firId = text(body.firId, 120);
    const fir = text(body.fir, 120);
    const status = text(body.status, 40);
    const actor = text(body.actor, 100);
    const reason = text(body.reason, 500);
    const evidenceRequirement = text(body.evidenceRequirement, 500);

    if (!firId || !fir || !actor || !reason || !ALLOWED_DECISIONS.has(status)) {
      return send(res, 400, { error: 'firId, fir, actor, reason, and an allowed status are required.' });
    }

    const recordedAt = new Date().toISOString();
    const saved = await table.insertRow({
      FirId: firId,
      FirNumber: fir,
      Decision: status,
      Actor: actor,
      Rationale: reason,
      EvidenceRequirement: evidenceRequirement,
      Source: 'CrimeSight synthetic prototype',
      CorrelationId: randomUUID(),
      RecordedAt: recordedAt,
    });

    return send(res, 201, { source: 'catalyst-data-store', action: toAction(saved) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[governed-review]', message);
    // Do not expose internal Catalyst metadata, table IDs, or credentials.
    return send(res, 503, {
      error: 'Governed review storage is temporarily unavailable.',
      code: 'GOVERNED_REVIEW_UNAVAILABLE',
    });
  }
};
