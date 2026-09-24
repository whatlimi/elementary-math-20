import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('docs/playlist-vocab.json', 'utf8'));
const all = {};
let t = 0;
for (const s of d) {
  for (const w of s.words) {
    all[w.name] = 1;
    t++;
  }
}
const u = Object.keys(all).length;
console.log(`songs=${d.length} hits=${t} unique=${u} coverage=${(u/3893*100).toFixed(1)}%`);
