import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LY = path.join(ROOT, 'docs', 'lyrics');
const WORDLIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'wordlist', 'GaoKao_3500.json'), 'utf8'));

const byName = new Map();
for (const w of WORDLIST) byName.set(w.name.toLowerCase(), w);
if (!byName.has('be')) byName.set('be', { name: 'be', usphone: '', ukphone: '', trans: ['v. 是'] });

const IRREGULAR = new Map(Object.entries({
  is:'be', am:'be', are:'be', was:'be', were:'be', been:'be', being:'be',
  has:'have', had:'have', having:'have', does:'do', did:'do', done:'do', doing:'do',
  went:'go', gone:'go', going:'go', made:'make', making:'make', said:'say', saying:'say', says:'say',
  saw:'see', seen:'see', seeing:'see', came:'come', coming:'come', took:'take', taken:'take', taking:'take',
  got:'get', gotten:'get', getting:'get', gave:'give', given:'give', giving:'give',
  knew:'know', known:'know', knowing:'know', thought:'think', thinking:'think', thinks:'think',
  found:'find', finding:'find', finds:'find', felt:'feel', feeling:'feel', feels:'feel',
  left:'leave', leaving:'leave', leaves:'leave', lost:'lose', losing:'lose', loses:'lose',
  told:'tell', telling:'tell', tells:'tell', held:'hold', holding:'hold', holds:'hold',
  kept:'keep', keeping:'keep', keeps:'keep', stood:'stand', standing:'stand', stands:'stand',
  met:'meet', meeting:'meet', meets:'meet', sat:'sit', sitting:'sit', sits:'sit',
  ran:'run', running:'run', runs:'run', wrote:'write', written:'write', writing:'write', writes:'write',
  spoke:'speak', spoken:'speak', speaking:'speak', speaks:'speak', drove:'drive', driven:'drive', driving:'drive', drives:'drive',
  wore:'wear', worn:'wear', wearing:'wear', wears:'wear', sang:'sing', sung:'sing', singing:'sing', sings:'sing',
  began:'begin', begun:'begin', beginning:'begin', begins:'begin', paid:'pay', paying:'pay', pays:'pay',
  lay:'lie', lying:'lie', lies:'lie', rose:'rise', risen:'rise', rising:'rise', rises:'rise',
  fell:'fall', fallen:'fall', falling:'fall', falls:'fall', grew:'grow', grown:'grow', growing:'grow', grows:'grow',
  threw:'throw', thrown:'throw', throwing:'throw', throws:'throw', drew:'draw', drawn:'draw', drawing:'draw', draws:'draw',
  flew:'fly', flown:'fly', flying:'fly', flies:'fly', broke:'break', broken:'break', breaking:'break', breaks:'break',
  chose:'choose', chosen:'choose', choosing:'choose', chooses:'choose', ate:'eat', eaten:'eat', eating:'eat', eats:'eat',
  slept:'sleep', sleeping:'sleep', sleeps:'sleep', spent:'spend', spending:'spend', spends:'spend',
  sent:'send', sending:'send', sends:'send', built:'build', building:'build', builds:'build',
  bought:'buy', buying:'buy', buys:'buy', brought:'bring', bringing:'bring', brings:'bring',
  caught:'catch', catching:'catch', catches:'catch', taught:'teach', teaching:'teach', teaches:'teach',
  fought:'fight', fighting:'fight', fights:'fight', won:'win', winning:'win', wins:'win',
  drank:'drink', drunk:'drink', drinking:'drink', drinks:'drink', swam:'swim', swimming:'swim', swims:'swim',
  rode:'ride', ridden:'ride', riding:'ride', rides:'ride', forgot:'forget', forgotten:'forget', forgetting:'forget', forgets:'forget',
  understood:'understand', understanding:'understand', understands:'understand',
  shook:'shake', shaken:'shake', shaking:'shake', shakes:'shake', woke:'wake', woken:'wake', waking:'wake', wakes:'wake',
  froze:'freeze', frozen:'freeze', freezing:'freeze', would:'will', could:'can', should:'shall', might:'may',
}));

const RESTRICT = /^[a-z]+(?:(?:'s|'d|'ll|'ve|'re|'m|'t))?$/;

function normalizeInflection(lower) {
  const clean = lower.replace(/['’]/g, '').toLowerCase();
  if (byName.has(clean)) return clean;
  if (IRREGULAR.has(clean)) { const b = IRREGULAR.get(clean); return byName.has(b) ? b : clean; }
  for (const suf of ["'re", "'ve", "'ll", "'m", "'d", "'s", "'t"]) {
    if (lower.endsWith(suf)) { const b = lower.slice(0, -suf.length); if (byName.has(b)) return b; }
  }
  const base = lower.replace(/['’].*$/, '');
  if (base !== lower && byName.has(base)) return base;
  const forms = [];
  if (lower.endsWith('ies')) forms.push(lower.slice(0, -3) + 'y');
  if (lower.endsWith('ves')) { forms.push(lower.slice(0, -3) + 'f'); forms.push(lower.slice(0, -3) + 'fe'); }
  if (lower.endsWith('es')) { forms.push(lower.slice(0, -2)); forms.push(lower.slice(0, -2) + 'e'); }
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us')) { forms.push(lower.slice(0, -1)); forms.push(lower.slice(0, -1) + 'e'); }
  if (lower.endsWith('ied')) forms.push(lower.slice(0, -3) + 'y');
  if (lower.endsWith('ed')) { const s = lower.slice(0, -2); forms.push(s, s + 'e', s + 'd'); }
  if (lower.endsWith('ing')) { const s = lower.slice(0, -3); forms.push(s, s + 'e', s + 'y', s + 't'); }
  if (lower.endsWith('ly')) forms.push(lower.slice(0, -2));
  for (const f of forms) if (byName.has(f)) return f;
  return null;
}

const NOISE = new Set(['sha','la','whoa','ooh','shing','ling','na','hey','la-la','la-la-la','ooh-whoa','ah','mm','oh']);

function tokenize(text) {
  return (text || '').toLowerCase().split(/[^a-z'’]+/).filter(t => t && /[a-z]/.test(t) && !NOISE.has(t.replace(/['’].*$/, '')));
}

function extractLyrics(text) {
  const hits = new Map();
  for (const tok of tokenize(text)) {
    const stem = normalizeInflection(tok);
    if (!stem) continue;
    const entry = byName.get(stem);
    if (entry) hits.set(entry.name, entry);
  }
  return [...hits.values()].sort((a, b) => a.name.localeCompare(b.name));
}

if (process.argv[2] === '--self-test') {
  const t = "When I was young I'd listen to the radio Waiting for my favorite songs. They're breakin' my heart. She was gone. I understood everything. He made me smile.";
  const words = extractLyrics(t);
  console.log('self-test:', words.map(w => w.name).join(' / '));
  process.exit(0);
}

if (!fs.existsSync(LY)) { console.log('NO lyrics dir'); process.exit(1); }
const files = fs.readdirSync(LY).filter(f => f.endsWith('.json')).sort();
const rows = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(LY, f), 'utf8'));
  if (!j.ok) { console.log(`MISS ${f}`); continue; }
  const words = extractLyrics(j.plainLyrics);
  rows.push({ id: j.id, artist: j.artist, title: j.title, n: words.length, words: words.map(w => ({ name: w.name, trans: w.trans ? w.trans.join('；') : '' })) });
  console.log(`${String(j.id).padStart(2, '0')} ${j.title.padEnd(24)} ${String(words.length).padStart(3)} words`);
}
const out = path.join(ROOT, 'docs', 'playlist-vocab.json');
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log('WROTE', out, 'songs:', rows.length);

const PLAYLIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'song-playlist.md'), 'utf8').replace(/^[\s\S]*$/, '') || '[]');
const md = ['# 45 首英文歌 — 每首歌对应高中 3500 词表', '',
  '> 自动生成：从每首歌的歌词文本中提取属于高中 3500 词表的词（对照 GaoKao_3500.json，3893 词）。',
  '> 词形还原：歌词中的屈折形式（过去式/复数/进行时等）自动归原后匹配词库。来源：lrclib.net 歌词 + qwerty-learner GaoKao_3500 词库。', ''];
const GROUPS = {};
for (const r of rows) GROUPS[r.id] = r;
for (const r of rows) {
  md.push(`## ${r.id}. ${r.title} — ${r.artist || ''}`, '');
  md.push(`**提取词数：${r.n}**`, '');
  md.push('| 词 | 释义 |', '|---|---|');
  for (const w of r.words) md.push(`| ${w.name} | ${w.trans} |`);
  md.push('');
}
const mdPath = path.join(ROOT, 'docs', 'playlist-vocab.md');
fs.writeFileSync(mdPath, md.join('\n'));
console.log('WROTE', mdPath);