/**
 * rICK JPEG Segment Codec (Maximum Trolling Edition)
 * --------------------------------------------------
 * We (ab)use JPEG APP15 segments (0xFFEF) to stash arbitrary JSON inside a totally innocent
 * looking `rickroll.jpg`. Each payload chunk is prefixed with the ASCII magic `rICK` so that
 * future archeologists (or our own decoder) can find and reconstruct the JSON.
 *
 * Segment payload layout (after the APP15 marker length bytes):
 *   0..3   : 'r' 'I' 'C' 'K'
 *   4      : version (currently 0x01)
 *   5..6   : total segment count (uint16 BE)
 *   7..8   : this segment index (0-based, uint16 BE)
 *   9      : flags (reserved for future trolling; currently 0)
 *   10..n  : raw UTF-8 JSON slice bytes
 *
 * The JPEG length field includes its two own bytes, so max payload per APP segment is 65533.
 * Subtract header (10) gives max data chunk ≈ 65523 bytes.
 *
 * Exports:
 *  - encodeNeverGonnaGiveJSON(json, baseJpeg) -> Promise<Blob>
 *  - decodeNeverGonnaLetYouDown(jpeg) -> Promise<any | null>
 *  - sniffRickPayloadMetadata(jpeg) -> Promise<RickPayloadMeta[]>
 *
 * No external deps; pure TypeScript doom magic.
 */

// ---------- Types ----------

export interface RickPayloadMeta {
  index: number;
  total: number;
  size: number; // data bytes in this chunk
}

interface InternalSegment {
  index: number;
  total: number;
  data: Uint8Array;
}

const RICK_MAGIC = new TextEncoder().encode('rICK'); // 4 bytes
const VERSION = 0x01;
const APP15_MARKER = 0xEF; // 0xFFEF
const HEADER_BYTES = 10; // magic(4) + ver(1) + total(2) + idx(2) + flags(1)
const MAX_SEGMENT_PAYLOAD = 65533; // per JPEG spec (length field max 0xFFFF minus 2 length bytes)
const MAX_DATA_PER_SEGMENT = MAX_SEGMENT_PAYLOAD - HEADER_BYTES; // data room

// ---------- Public API ----------

/**
 * Encodes JSON into one or more rICK APP15 segments inserted after existing APPn segments.
 * If baseJpeg is omitted, caller should supply it; we do not auto-fetch to keep this pure.
 */
export async function encodeNeverGonnaGiveJSON(
  json: unknown,
  baseJpeg: ArrayBuffer | Uint8Array | Blob
): Promise<Blob> {
  const baseBytes = await toBytes(baseJpeg);
  assertJpeg(baseBytes);
  const jsonStr = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(jsonStr);

  // Slice into chunks
  const segments: Uint8Array[] = [];
  for (let offset = 0; offset < jsonBytes.length; offset += MAX_DATA_PER_SEGMENT) {
    segments.push(jsonBytes.subarray(offset, Math.min(offset + MAX_DATA_PER_SEGMENT, jsonBytes.length)));
  }
  const total = segments.length;

  const insertionPoint = findAppInsertionPoint(baseBytes);
  const outParts: Uint8Array[] = [];
  outParts.push(baseBytes.subarray(0, insertionPoint));

  segments.forEach((chunk, idx) => {
    outParts.push(buildRickSegment(chunk, idx, total));
  });

  outParts.push(baseBytes.subarray(insertionPoint));

  const combined = concat(outParts);
  // Copy into a fresh ArrayBuffer (guaranteed plain ArrayBuffer) to appease picky TS libs.
  const ab = new ArrayBuffer(combined.byteLength);
  new Uint8Array(ab).set(combined);
  return new Blob([ab], { type: 'image/jpeg' });
}

/**
 * Decodes the first full set of rICK segments found. Returns JSON or null if absent.
 */
export async function decodeNeverGonnaLetYouDown(
  jpeg: ArrayBuffer | Uint8Array | Blob
): Promise<any | null> {
  const bytes = await toBytes(jpeg);
  assertJpeg(bytes);
  const segments = extractRickSegments(bytes);
  if (!segments.length) return null;

  // Choose the set with consistent total; ignore incomplete garbage.
  const byTotal = new Map<number, InternalSegment[]>();
  for (const seg of segments) {
    if (!byTotal.has(seg.total))
      byTotal.set(seg.total, []);

    byTotal.get(seg.total)!.push(seg);
  }
  // Find a group where we have all indices 0..total-1
  let chosen: InternalSegment[] | null = null;
  for (const [total, segs] of byTotal) {
    if (segs.length === total && indicesComplete(segs, total)) {
      chosen = segs;
      break;
    }
  }
  if (!chosen) return null;
  chosen.sort((a, b) => a.index - b.index);
  const dataBytes = concat(chosen.map(s => s.data));
  try {
    const jsonStr = new TextDecoder().decode(dataBytes);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Returns lightweight metadata for all discovered rICK chunks (may include incomplete sets).
 */
export async function sniffRickPayloadMetadata(
  jpeg: ArrayBuffer | Uint8Array | Blob
): Promise<RickPayloadMeta[]> {
  const bytes = await toBytes(jpeg);
  assertJpeg(bytes);
  return extractRickSegments(bytes).map(s => ({ index: s.index, total: s.total, size: s.data.length }));
}

// ---------- Helpers ----------

function indicesComplete(segs: InternalSegment[], total: number): boolean {
  const seen = new Set(segs.map(s => s.index));
  if (seen.size !== total) return false;
  for (let i = 0; i < total; i++) if (!seen.has(i)) return false;
  return true;
}

function toBytes(data: ArrayBuffer | Uint8Array | Blob): Promise<Uint8Array> | Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Blob) return data.arrayBuffer().then(ab => new Uint8Array(ab));
  throw new Error('Unsupported data type');
}

function assertJpeg(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    throw new Error('Not a JPEG (missing SOI) – nice try.');
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function buildRickSegment(data: Uint8Array, index: number, total: number): Uint8Array {
  const header = new Uint8Array(HEADER_BYTES + data.length);
  header.set(RICK_MAGIC, 0);
  header[4] = VERSION;
  header[5] = (total >>> 8) & 0xFF;
  header[6] = total & 0xFF;
  header[7] = (index >>> 8) & 0xFF;
  header[8] = index & 0xFF;
  header[9] = 0; // flags
  header.set(data, HEADER_BYTES);
  // Wrap with marker + length
  const segmentLen = header.length + 2; // include length bytes
  const out = new Uint8Array(2 + 2 + header.length); // marker(2)+len(2)+payload
  out[0] = 0xFF;
  out[1] = APP15_MARKER;
  out[2] = (segmentLen >>> 8) & 0xFF;
  out[3] = segmentLen & 0xFF;
  out.set(header, 4);
  return out;
}

function findAppInsertionPoint(bytes: Uint8Array): number {
  // After SOI (0xFFD8) and any existing APPn segments.
  let offset = 2; // skip SOI
  while (offset + 4 < bytes.length && bytes[offset] === 0xFF) {
    const marker = bytes[offset + 1];
    if (marker === 0xDA || marker === 0xD9) break; // SOS or EOI
    if (marker >= 0xE0 && marker <= 0xEF) {
      const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + len; // marker+len+payload
      continue;
    }
    // For other markers with length
    if (!markerHasLength(marker)) break;
    const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 2 + len;
  }
  return offset;
}

function markerHasLength(marker: number): boolean {
  // Markers without length: SOI D8, EOI D9, RSTn D0-D7, TEM 01
  if (marker === 0xD8 || marker === 0xD9) return false;
  if (marker >= 0xD0 && marker <= 0xD7) return false;
  if (marker === 0x01) return false;
  return true;
}

function extractRickSegments(bytes: Uint8Array): InternalSegment[] {
  const segs: InternalSegment[] = [];
  let offset = 2; // skip SOI
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xFF) {
      // We hit scan data or corruption; bail.
      break;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xDA) break; // Start of Scan
    if (marker === 0xD9) break; // EOI
    if (!markerHasLength(marker)) {
      offset += 2;
      continue;
    }
    const len = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const start = offset + 4;
    const end = start + len - 2; // len includes its two bytes
    if (end > bytes.length) break;
    if (marker === APP15_MARKER) {
      const payload = bytes.subarray(start, end);
      if (payload.length >= HEADER_BYTES && hasMagic(payload)) {
        const version = payload[4];
        if (version === VERSION) {
          const total = (payload[5] << 8) | payload[6];
          const index = (payload[7] << 8) | payload[8];
          const data = payload.subarray(HEADER_BYTES);
          segs.push({ index, total, data });
        }
      }
    }
    offset = end;
  }
  return segs;
}

function hasMagic(buf: Uint8Array): boolean {
  for (let i = 0; i < RICK_MAGIC.length; i++) if (buf[i] !== RICK_MAGIC[i]) return false;
  return true;
}

// ---------- Easter Egg (optional helper) ----------

/**
 * Convenience one-liner: takes JSON & base JPEG Blob, returns a File you can download.
 */
export async function rollThatJSON(json: unknown, baseJpeg: Blob): Promise<File> {
  const blob = await encodeNeverGonnaGiveJSON(json, baseJpeg);
  return new File([blob], 'never-gonna-give-you-up.jpg', { type: 'image/jpeg' });
}

/**
 * Quick debug: attempt decode and log results.
 */
export async function debugUnroll(jpeg: Blob | ArrayBuffer | Uint8Array): Promise<void> {
  const meta = await sniffRickPayloadMetadata(jpeg);
  // eslint-disable-next-line no-console
  console.log('rICK meta', meta);
  const data = await decodeNeverGonnaLetYouDown(jpeg);
  // eslint-disable-next-line no-console
  console.log('rICK data', data);
}

// The end. Never gonna give you up, never gonna let you down.


// ---------- ZIP convenience (opt-in) ----------

/**
 * Wrap a JPEG Blob/bytes into a minimal ZIP (stored/no compression) to avoid messenger re-encoding.
 * Returns a Blob with MIME type application/zip.
 */
export async function wrapInZip(
  jpeg: Blob | ArrayBuffer | Uint8Array,
  filename = 'rickroll.jpg'
): Promise<Blob> {
  const data = await toBytes(jpeg);
  const fname = new TextEncoder().encode(filename);
  const crc = crc32(data) >>> 0;
  const uncompSize = data.length;
  const compSize = uncompSize; // stored

  // Local file header (little-endian fields)
  const localHeader = new Uint8Array(30 + fname.length);
  let p = 0;
  writeUInt32LE(localHeader, p, 0x04034b50); p += 4; // local file header signature
  writeUInt16LE(localHeader, p, 20); p += 2; // version needed
  writeUInt16LE(localHeader, p, 0); p += 2; // gp bit
  writeUInt16LE(localHeader, p, 0); p += 2; // method = 0 (stored)
  writeUInt16LE(localHeader, p, 0); p += 2; // mod time
  writeUInt16LE(localHeader, p, 0); p += 2; // mod date
  writeUInt32LE(localHeader, p, crc); p += 4; // crc32
  writeUInt32LE(localHeader, p, compSize); p += 4; // compressed size
  writeUInt32LE(localHeader, p, uncompSize); p += 4; // uncompressed size
  writeUInt16LE(localHeader, p, fname.length); p += 2;
  writeUInt16LE(localHeader, p, 0); p += 2; // extra len
  localHeader.set(fname, p);

  const localOffset = 0; // we'll place it at start of archive

  // Central directory header
  const central = new Uint8Array(46 + fname.length);
  p = 0;
  writeUInt32LE(central, p, 0x02014b50); p += 4; // central dir signature
  writeUInt16LE(central, p, 20); p += 2; // version made by
  writeUInt16LE(central, p, 20); p += 2; // version needed
  writeUInt16LE(central, p, 0); p += 2; // gp bit
  writeUInt16LE(central, p, 0); p += 2; // method
  writeUInt16LE(central, p, 0); p += 2; // mod time
  writeUInt16LE(central, p, 0); p += 2; // mod date
  writeUInt32LE(central, p, crc); p += 4;
  writeUInt32LE(central, p, compSize); p += 4;
  writeUInt32LE(central, p, uncompSize); p += 4;
  writeUInt16LE(central, p, fname.length); p += 2;
  writeUInt16LE(central, p, 0); p += 2; // extra len
  writeUInt16LE(central, p, 0); p += 2; // comment len
  writeUInt16LE(central, p, 0); p += 2; // disk start
  writeUInt16LE(central, p, 0); p += 2; // internal attrs
  writeUInt32LE(central, p, 0); p += 4; // external attrs
  writeUInt32LE(central, p, localOffset); p += 4; // rel offset of local header
  central.set(fname, p);

  // End of central directory
  const eocd = new Uint8Array(22);
  p = 0;
  writeUInt32LE(eocd, p, 0x06054b50); p += 4;
  writeUInt16LE(eocd, p, 0); p += 2; // disk
  writeUInt16LE(eocd, p, 0); p += 2; // start disk
  writeUInt16LE(eocd, p, 1); p += 2; // entries this disk
  writeUInt16LE(eocd, p, 1); p += 2; // total entries
  writeUInt32LE(eocd, p, central.length); p += 4; // central dir size
  writeUInt32LE(eocd, p, localHeader.length + data.length); p += 4; // central dir offset (after local header+data)
  writeUInt16LE(eocd, p, 0); p += 2; // comment len

  // Build full ZIP: localHeader + data + central + eocd
  const full = concat([localHeader, data, central, eocd]);
  const ab = new ArrayBuffer(full.byteLength);
  new Uint8Array(ab).set(full);
  return new Blob([ab], { type: 'application/zip' });
}

/**
 * Encode JSON into rICK segments, then return a .zip Blob containing the JPG.
 */
export async function encodeAndZip(
  json: unknown,
  baseJpeg: ArrayBuffer | Uint8Array | Blob,
  zipFilename = 'never-gonna-give-you-up.zip',
  imageFilename = 'never-gonna-give-you-up.jpg'
): Promise<Blob> {
  const jpegBlob = await encodeNeverGonnaGiveJSON(json, baseJpeg);
  const wrapped = await wrapInZip(jpegBlob, imageFilename);
  // rename zip file by wrapping in File if caller needs a filename; Blob doesn't carry filename.
  return new File([await wrapped.arrayBuffer()], zipFilename, { type: 'application/zip' });
}

// ---------- tiny binary helpers ----------

function writeUInt32LE(buf: Uint8Array, offset: number, v: number) {
  buf[offset] = v & 0xFF;
  buf[offset + 1] = (v >>> 8) & 0xFF;
  buf[offset + 2] = (v >>> 16) & 0xFF;
  buf[offset + 3] = (v >>> 24) & 0xFF;
}

function writeUInt16LE(buf: Uint8Array, offset: number, v: number) {
  buf[offset] = v & 0xFF;
  buf[offset + 1] = (v >>> 8) & 0xFF;
}

// CRC32 implementation
let _crcTable: number[] | null = null;
function makeCrcTable() {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  _crcTable = t;
}

export function crc32(b: Uint8Array): number {
  if (!_crcTable) makeCrcTable();
  let crc = 0 ^ -1;
  for (let i = 0; i < b.length; i++) {
    crc = (crc >>> 8) ^ (_crcTable![(crc ^ b[i]) & 0xFF]);
  }
  return (crc ^ -1) >>> 0;
}

