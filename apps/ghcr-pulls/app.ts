import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const log = (str: string) => console.log(`[${new Date().toISOString()}] ghcr-pulls: ${str}`);

const packages = ['simonwep/ocular/pkgs/container/ocular'];
const dir = dirname(fileURLToPath(import.meta.url));
const dist = join(dir, 'dist');
const template = await readFile(join(dir, 'template.svg'), 'utf8');

await mkdir(dist, { recursive: true }).catch(() => null);

for (const pkg of packages) {
  const data = await fetch(`https://github.com/${pkg}`).then((res) => res.text());
  const trimmed = data.trim().replace(/\s/g, '');
  const count = /Totaldownloads.*?h3.*?>(.*?)</.exec(trimmed)?.[1];

  const values = {
    count: `${count} docker pulls`,
    title: `${count} docker container registry pulls in total`
  };

  const badge = template.replace(/\{(.*?)}/g, (_, key) => values[key as keyof typeof values] ?? '');
  const containerName = pkg.split('/').pop();
  await writeFile(join(dist, `${containerName}.svg`), badge);
  log(`generated ${containerName}.svg`);
}
