'use strict';

/**
 * CrimeSight Field FIR intake — Catalyst Advanced I/O Function.
 *
 * Required Catalyst resources before deployment:
 * - Data Store table: FieldFirReports (all listed fields are Text)
 * - Private Stratus bucket: crimesight-field-evidence
 *
 * This receives synthetic prototype reports only. It does not initiate any
 * policing action, make risk decisions, or expose evidence objects publicly.
 */
const catalyst = require('zcatalyst-sdk-node');
const { randomUUID } = require('crypto');
const { Readable } = require('stream');

const TABLE_NAME = process.env.FIELD_FIR_TABLE || 'FieldFirReports';
const EVIDENCE_BUCKET = process.env.FIELD_FIR_EVIDENCE_BUCKET || 'crimesight-field-evidence';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://crimesight-dep-onmoxbpk.onslate.in')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const PRIORITIES = new Set(['Low', 'Medium', 'High', 'Critical']);
const MAX_PHOTOS = 5;
const MAX_BODY_BYTES = 8 * 1024 * 1024;

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
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Request body must be valid JSON.')); }
    });
    req.on('error', reject);
  });
}

function text(value, length) {
  return typeof value === 'string' ? value.trim().slice(0, length) : '';
}

function safeFileName(name) {
  const ext = text(name, 120).split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return ext ? `evidence.${ext.toLowerCase()}` : 'evidence.jpg';
}

function decodePhoto(photo) {
  const dataUrl = text(photo?.dataUrl, MAX_BODY_BYTES);
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Evidence must be a JPEG, PNG, or WebP image.');
  return { type: match[1], bytes: Buffer.from(match[2], 'base64') };
}

function toReport(row) {
  return {
    id: String(row.ROWID),
    fir: row.FirNumber,
    officerName: row.OfficerName,
    badgeNumber: row.BadgeNumber,
    district: row.District,
    policeStation: row.PoliceStation,
    crimeType: row.CrimeType,
    place: row.Place,
    description: row.Description,
    priority: row.CasePriority,
    status: row.CaseStatus,
    photos: row.EvidenceKeys ? String(row.EvidenceKeys).split(',').filter(Boolean).map((key, index) => ({
      id: `${row.ROWID}-${index}`,
      name: key.split('/').pop(),
      size: 0,
      type: 'stored-in-private-stratus',
      dataUrl: '',
      timestamp: row.SubmittedAt,
    })) : [],
    submittedAt: row.SubmittedAt || row.CREATEDTIME,
    lastStatusUpdate: row.LastStatusUpdate || row.SubmittedAt || row.CREATEDTIME,
    source: 'catalyst',
    correlationId: row.CorrelationId,
  };
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return send(res, 204, {});

  const url = new URL(req.url, 'https://field-fir-intake.invalid');
  if (url.pathname !== '/' && url.pathname !== '/reports') return send(res, 404, { error: 'Not found.' });

  try {
    const app = catalyst.initialize(req, { scope: 'admin' });
    const table = app.datastore().table(TABLE_NAME);

    if (req.method === 'GET') {
      const { data } = await table.getPagedRows({ maxRows: 100 });
      return send(res, 200, {
        source: 'catalyst-data-store',
        reports: data.map(toReport).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
      });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });

    const body = await readJson(req);
    const officerName = text(body.officerName, 100);
    const badgeNumber = text(body.badgeNumber, 60);
    const district = text(body.district, 100);
    const policeStation = text(body.policeStation, 120);
    const crimeType = text(body.crimeType, 100);
    const place = text(body.place, 300);
    const description = text(body.description, 2_000);
    const priority = text(body.priority, 20);
    const photos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];

    if (!officerName || !badgeNumber || !district || !policeStation || !crimeType || !place || !description || !PRIORITIES.has(priority)) {
      return send(res, 400, { error: 'A complete synthetic Field FIR with an allowed priority is required.' });
    }

    const correlationId = randomUUID();
    const fir = `FIR/2026/KSP/FIELD-${correlationId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const submittedAt = new Date().toISOString();
    const evidenceKeys = [];

    if (photos.length) {
      const bucket = app.stratus().bucket(EVIDENCE_BUCKET);
      for (let index = 0; index < photos.length; index += 1) {
        const decoded = decodePhoto(photos[index]);
        if (!decoded.bytes.length || decoded.bytes.length > 2 * 1024 * 1024) {
          return send(res, 400, { error: 'Each evidence image must be under 2 MB.' });
        }
        const key = `field-fir/${correlationId}/${String(index + 1).padStart(2, '0')}-${safeFileName(photos[index].name)}`;
        await bucket.putObject(key, Readable.from(decoded.bytes), {
          contentType: decoded.type,
          metaData: { fir, correlationId, prototype: 'synthetic-only' },
        });
        evidenceKeys.push(key);
      }
    }

    const saved = await table.insertRow({
      FirNumber: fir,
      OfficerName: officerName,
      BadgeNumber: badgeNumber,
      District: district,
      PoliceStation: policeStation,
      CrimeType: crimeType,
      Place: place,
      Description: description,
      CasePriority: priority,
      CaseStatus: 'Submitted',
      PhotoCount: String(evidenceKeys.length),
      EvidenceKeys: evidenceKeys.join(','),
      SubmittedAt: submittedAt,
      LastStatusUpdate: submittedAt,
      IntakeSource: 'CrimeSight synthetic prototype',
      CorrelationId: correlationId,
    });

    return send(res, 201, { source: 'catalyst-data-store', report: toReport(saved) });
  } catch (error) {
    console.error('[field-fir-intake]', error instanceof Error ? error.message : 'Unknown error');
    return send(res, 503, { error: 'Field FIR intake is temporarily unavailable.', code: 'FIELD_FIR_INTAKE_UNAVAILABLE' });
  }
};
