import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '..', 'docs', 'wordlist', 'GaoKao_3500.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
https.get('https://cdn.jsdelivr.net/gh/RealKai42/qwerty-learner@master/public/dicts/GaoKao_3500.json', r => {
  if (r.statusCode !== 200) { console.log('HTTP', r.statusCode); process.exit(1); }
  const body = [];
  r.on('data', d => body.push(d));
  r.on('end', () => {
    const raw = Buffer.concat(body).toString('utf8');
    fs.writeFileSync(out, raw);
    const arr = JSON.parse(raw);
    console.log('OK words:', arr.length, 'bytes:', raw.length);
  });
}).on('error', e => { console.log('ERR', e.code || e.message); process.exit(1); });