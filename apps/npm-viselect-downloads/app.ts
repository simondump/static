import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appName = 'npm-viselect-downloads';
const packages = ['@viselect/vanilla', '@viselect/react', '@viselect/preact', '@viselect/vue'];

const dir = dirname(fileURLToPath(import.meta.url));
const dist = join(dir, 'dist');

type DownloadResponse = {
  downloads: number;
  package: string;
};

const log = (message: string) => console.log(`[${new Date().toISOString()}] ${appName}: ${message}`);

const fetchDownloads = async (packageName: string): Promise<number> => {
  const response = await fetch(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`);

  if (!response.ok) {
    throw new Error(`npm API returned ${response.status} for ${packageName}`);
  }

  return ((await response.json()) as DownloadResponse).downloads;
};

const downloads = await Promise.all(packages.map(fetchDownloads));
const totalDownloads = downloads.reduce((total, downloads) => total + downloads, 0);

const formattedDownloads = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: totalDownloads > 1_000_000 ? 1 : 0
}).format(totalDownloads);

const badgeUrl = new URL(
  `https://img.shields.io/badge/${encodeURIComponent('downloads (all pkgs)')}-${encodeURIComponent(`${formattedDownloads}/month`)}-3ea901.svg`
);

const badgeResponse = await fetch(badgeUrl);

if (!badgeResponse.ok) {
  throw new Error(`Shields.io returned ${badgeResponse.status}`);
}

const badge = await badgeResponse.text();
if (!badge.startsWith('<svg')) {
  throw new Error('Shields.io returned an invalid SVG badge');
}

await mkdir(dist, { recursive: true });
await writeFile(join(dist, 'viselect.svg'), badge);

log(`generated viselect.svg with ${totalDownloads.toLocaleString('en')} downloads in the last month`);
