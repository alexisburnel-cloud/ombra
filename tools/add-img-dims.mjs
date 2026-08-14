import { readFileSync, writeFileSync } from 'fs';

const path = new URL('../index.html', import.meta.url);
let h = readFileSync(path, 'utf8');

const dims = {
  'archive-1980.jpg': [1920, 1244],
  'archive-1990.jpg': [1920, 1276],
  'maison-2000.jpg': [1920, 1064],
  'maison-2010.jpg': [1920, 1278],
  'maison-2020.jpg': [1920, 1224],
  'rameur-avant.jpg': [1920, 1280]
};

let n = 0;
for (const [f, [w, ht]] of Object.entries(dims)) {
  const from = `src="/photos/${f}" loading="lazy"`;
  const to = `src="/photos/${f}" width="${w}" height="${ht}" loading="lazy"`;
  h = h.split(from).join(to);
  n += (h.match(new RegExp(`${f}" width=`, 'g')) || []).length;
}
writeFileSync(path, h, 'utf8');
console.log('images dimensionnées:', n);
