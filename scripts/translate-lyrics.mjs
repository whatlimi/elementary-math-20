import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'docs', 'lyrics');

const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.json')).sort();

for (const f of files) {
  const p = path.join(ROOT, f);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!j.ok || !j.plainLyrics) continue;
  if (j.transLyrics) { console.log(`SKIP ${j.id} ${j.title}`); continue; }

  const lines = j.plainLyrics.split('\n');
  const transLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { transLines.push(''); continue; }
    if (!/[a-zA-Z]/.test(line)) { transLines.push(line); continue; }

    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(line) + '&langpair=en|zh-CN';
    try {
      const res = await fetch(url);
      const data = await res.json();
      let trans = data.responseData?.translatedText || '';
      trans = trans.replace(/\\n/g, ' ').trim();
      transLines.push(trans);
    } catch (e) {
      transLines.push('[翻译失败]');
      console.error(`ERR line ${i}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  j.transLyrics = transLines.join('\n');
  fs.writeFileSync(p, JSON.stringify(j, null, 2));
  console.log(`OK ${j.id} ${j.title} (${lines.length} lines)`);
}

console.log('DONE');
