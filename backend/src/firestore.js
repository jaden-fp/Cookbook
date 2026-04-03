import { createSign } from 'node:crypto';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Auth ──────────────────────────────────────────────────────────────────────

let _token = null;
let _tokenExpiry = 0;

export async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signing = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signing);
  const jwt = `${signing}.${sign.sign(PRIVATE_KEY, 'base64url')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _token;
}

async function req(url, opts = {}) {
  const token = await getToken();
  return fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
  });
}

// ── Value serialization ───────────────────────────────────────────────────────

function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  return { nullValue: null };
}

function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toValue(v);
  }
  return fields;
}

function fromValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  return null;
}

function fromFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) obj[k] = fromValue(v);
  return obj;
}

function fromDoc(doc) {
  return { id: doc.name.split('/').pop(), ...fromFields(doc.fields || {}) };
}

// ── Firebase Storage upload ───────────────────────────────────────────────────

export async function fsUploadImage(base64DataUrl, filename) {
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid data URL');
  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');

  const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.appspot.com`;
  const { randomUUID } = await import('node:crypto');
  const downloadToken = randomUUID();

  const token = await getToken();
  const encodedName = encodeURIComponent(filename);
  const encodedBucket = encodeURIComponent(bucket);

  // Use Firebase Storage REST API (supports both appspot.com and firebasestorage.app buckets)
  const uploadRes = await fetch(
    `https://firebasestorage.googleapis.com/v0/b/${encodedBucket}/o?name=${encodedName}&uploadType=media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: buffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Storage upload failed: ${err}`);
  }

  // Set the download token so the URL works without Firebase auth
  await fetch(
    `https://firebasestorage.googleapis.com/v0/b/${encodedBucket}/o/${encodedName}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: { firebaseStorageDownloadTokens: downloadToken } }),
    }
  );

  return `https://firebasestorage.googleapis.com/v0/b/${encodedBucket}/o/${encodedName}?alt=media&token=${downloadToken}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function fsAdd(collection, data) {
  const res = await req(`${BASE}/${collection}`, {
    method: 'POST',
    body: JSON.stringify({ fields: toFields(data) }),
  });
  return fromDoc(await res.json());
}

export async function fsGet(collection, id) {
  const res = await req(`${BASE}/${collection}/${id}`);
  if (res.status === 404) return null;
  const doc = await res.json();
  if (doc.error) return null;
  return fromDoc(doc);
}

export async function fsUpdate(collection, id, data) {
  const fields = toFields(data);
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const res = await req(`${BASE}/${collection}/${id}?${mask}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
  return fromDoc(await res.json());
}

export async function fsDelete(collection, id) {
  await req(`${BASE}/${collection}/${id}`, { method: 'DELETE' });
}

export async function fsQuery(collection, { orderBy, orderDir = 'DESCENDING', where: filter } = {}) {
  const query = { from: [{ collectionId: collection }] };
  if (orderBy) query.orderBy = [{ field: { fieldPath: orderBy }, direction: orderDir }];
  if (filter) {
    query.where = {
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: filter.op,
        value: toValue(filter.value),
      },
    };
  }
  const res = await req(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    { method: 'POST', body: JSON.stringify({ structuredQuery: query }) }
  );
  const rows = await res.json();
  return rows.filter(r => r.document).map(r => fromDoc(r.document));
}
