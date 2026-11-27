// Builds the brand kit ZIP (site/public/brand/cctools-brand-kit.zip) from the
// files in brand/ at every build, so the download never drifts from the files
// the brand assets page links one by one. Each cctools-* file goes into the
// folder its name starts with, beside a short README. Plain ZIP (deflate),
// no dependency.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const FOLDERS = [
  ['cctools-logo-', 'logo'],
  ['cctools-wordmark-', 'wordmark'],
  ['cctools-icon-', 'icon'],
  ['cctools-avatar', 'avatar'],
];

const README = [
  'CCTools brand kit',
  '',
  'Colors, type and usage rules: https://docs.cctools.network/community/brand-assets',
  '',
  'logo/      the logo (lime icon and wordmark): light and dark backgrounds, stacked, one color, editorial',
  'wordmark/  the wordmark alone',
  'icon/      the icon: lime (primary), ink, white, and the 16 px cut',
  'avatar/    square and circle-safe, for X, Telegram and Discord',
  '',
  'Write the name as CCTools. X: @cantontools. Site: cctools.network.',
  '',
].join('\r\n');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// A fixed timestamp (25 Sep 2026, the day the identity was approved), so two builds of the same files give the same ZIP.
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (9 << 5) | 25;

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, packed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // made by Unix, so the mode below applies
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // a regular file, rw-r--r--
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + packed.length;
  }
  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

/** Writes cctools-brand-kit.zip into `outDir` from the cctools-* files of `brandDir`; returns the file count. */
export function writeBrandKit(brandDir, outDir) {
  const files = readdirSync(brandDir)
    .filter((f) => f.startsWith('cctools-') && /\.(svg|png)$/.test(f))
    .sort();
  const entries = [{ name: 'cctools-brand-kit/README.txt', data: Buffer.from(README, 'utf8') }];
  for (const file of files) {
    const folder = FOLDERS.find(([prefix]) => file.startsWith(prefix));
    if (!folder) throw new Error(`brand/${file}: no kit folder for this name (see FOLDERS in brand-kit.mjs)`);
    entries.push({ name: `cctools-brand-kit/${folder[1]}/${file}`, data: readFileSync(join(brandDir, file)) });
  }
  writeFileSync(join(outDir, 'cctools-brand-kit.zip'), zip(entries));
  return files.length;
}
