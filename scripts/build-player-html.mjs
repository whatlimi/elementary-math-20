import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LY = path.join(ROOT, 'docs', 'lyrics');
const WORDLIST = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'wordlist', 'GaoKao_3500.json'), 'utf8'));

const byName = new Map();
for (const w of WORDLIST) byName.set(w.name.toLowerCase(), w);
if (!byName.has('be')) byName.set('be', { name: 'be', trans: ['v. 是'] });

const IRREGULAR = Object.entries({
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
  rode:'ride', ridden:'ride', riding:'ride', rides:'ride', forgot:'forget', forgotten:'forget', getting:'get', forgets:'forget',
  understood:'understand', understanding:'understand', understands:'understand',
  shook:'shake', shaken:'shake', shaking:'shake', shakes:'shake', woke:'wake', woken:'wake', waking:'wake', wakes:'wake',
  froze:'freeze', frozen:'freeze', freezing:'freeze', would:'will', could:'can', should:'shall', might:'may',
});

function normalizeInflection(lower) {
  const clean = lower.replace(/['']/g, '').toLowerCase();
  if (byName.has(clean)) return clean;
  if (IRREGULAR[clean]) { const b = IRREGULAR[clean]; return byName.has(b) ? b : clean; }
  for (const suf of ["'re", "'ve", "'ll", "'m", "'d", "'s", "'t"]) {
    if (lower.endsWith(suf)) { const b = lower.slice(0, -suf.length); if (byName.has(b)) return b; }
  }
  const base = lower.replace(/[''].*$/, '');
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
  return (text || '').toLowerCase().split(/[^a-z'']+/).filter(t => t && /[a-z]/.test(t) && !NOISE.has(t.replace(/[''].*$/, '')));
}

const files = fs.readdirSync(LY).filter(f => f.endsWith('.json')).sort();
const songs = [];
const allWords = new Set();

for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(LY, f), 'utf8'));
  if (!j.ok) continue;
  const tokens = tokenize(j.plainLyrics);
  const wordMap = {};
  for (const tok of tokens) {
    const stem = normalizeInflection(tok);
    if (!stem) continue;
    const entry = byName.get(stem);
    if (entry) {
      wordMap[entry.name] = entry.trans ? entry.trans.join('；') : '';
      allWords.add(entry.name);
    }
  }
  songs.push({
    id: j.id,
    a: j.artist,
    t: j.title,
    l: j.plainLyrics,
    w: wordMap,
    n: Object.keys(wordMap).length,
  });
  console.log(`${String(j.id).padStart(2,'0')} ${j.title.padEnd(24)} ${String(Object.keys(wordMap).length).padStart(3)} words`);
}

const data = {
  songs,
  totalUnique: allWords.size,
  coverage: (allWords.size / 3893 * 100).toFixed(1),
  wordlistSize: 3893,
};

const dataJson = JSON.stringify(data);
console.log(`\n数据大小: ${(dataJson.length / 1024).toFixed(0)} KB`);
console.log(`独立词数: ${allWords.size}, 覆盖率: ${data.coverage}%`);

const html = buildHtml(dataJson);
const outPath = path.join(ROOT, 'song-vocab-player.html');
fs.writeFileSync(outPath, html);
console.log(`\nWROTE ${outPath} (${(html.length / 1024).toFixed(0)} KB)`);

function buildHtml(dataJson) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>听歌悟单词 — 45 首英文歌记完高中 3500 词</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#1a1a2e;--bg2:#16213e;--bg3:#0f3460;--accent:#e94560;--text:#eee;--text2:#aaa;--vocab:#4ecca3;--vocabBg:rgba(78,204,163,.12);--vocabHover:rgba(78,204,163,.25);--tooltip:#2d2d44;--border:#2a2a4a}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);height:100vh;overflow:hidden}
.app{display:flex;height:100vh}
.sidebar{width:300px;min-width:300px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.sidebar-header{padding:16px;border-bottom:1px solid var(--border)}
.sidebar-header h1{font-size:18px;color:var(--accent);margin-bottom:4px}
.sidebar-header .stats{font-size:12px;color:var(--text2)}
.search-box{padding:8px 12px;border-bottom:1px solid var(--border)}
.search-box input{width:100%;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;outline:none}
.search-box input:focus{border-color:var(--accent)}
.song-list{flex:1;overflow-y:auto;padding:4px}
.song-item{padding:10px 14px;cursor:pointer;border-radius:6px;margin:2px 4px;transition:background .15s;display:flex;align-items:center;gap:8px}
.song-item:hover{background:var(--bg3)}
.song-item.active{background:var(--bg3);border-left:3px solid var(--accent)}
.song-num{font-size:12px;color:var(--text2);min-width:24px}
.song-info{flex:1;min-width:0}
.song-title{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.song-artist{font-size:11px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.song-words{font-size:11px;color:var(--vocab);min-width:32px;text-align:right}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.main-header{padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px;background:var(--bg2)}
.main-header h2{font-size:18px;flex:1}
.main-header .artist{color:var(--text2);font-size:14px;font-weight:normal}
.player-bar{display:flex;gap:8px;align-items:center}
.player-bar a{padding:6px 12px;border-radius:6px;font-size:12px;text-decoration:none;color:var(--text);background:var(--bg3);transition:background .15s;display:flex;align-items:center;gap:4px;white-space:nowrap}
.player-bar a:hover{background:var(--accent)}
.content{flex:1;overflow-y:auto;padding:20px 28px}
.lyrics{font-size:16px;line-height:2.2;white-space:pre-wrap;font-family:'Georgia',serif}
.lyrics .v{color:var(--vocab);background:var(--vocabBg);border-radius:3px;padding:1px 3px;cursor:help;transition:background .15s;position:relative}
.lyrics .v:hover{background:var(--vocabHover)}
.tooltip{position:fixed;z-index:1000;background:var(--tooltip);border:1px solid var(--vocab);border-radius:8px;padding:10px 14px;max-width:360px;font-size:13px;line-height:1.6;color:var(--text);box-shadow:0 4px 20px rgba(0,0,0,.5);font-family:'Segoe UI',system-ui,sans-serif;pointer-events:none}
.tooltip .tw{font-size:15px;color:var(--vocab);font-weight:bold;margin-bottom:2px}
.vocab-panel{width:360px;min-width:360px;background:var(--bg2);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.vocab-panel-header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.vocab-panel-header h3{font-size:14px;color:var(--accent)}
.vocab-panel-header .count{font-size:12px;color:var(--text2)}
.vocab-list{flex:1;overflow-y:auto;padding:8px}
.trans-item{padding:8px 12px;margin:2px 0;border-radius:4px}
.trans-item .en{font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:4px}
.trans-item .zh{font-size:13px;color:var(--vocab);line-height:1.6}
.trans-item .zh.loading{color:var(--text2);font-style:italic;font-size:11px}
.empty{text-align:center;padding:40px;color:var(--text2)}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--bg3)}
@media(max-width:900px){.vocab-panel{width:240px;min-width:240px}.sidebar{width:200px;min-width:200px}}
@media(max-width:600px){.sidebar{width:180px;min-width:180px}.content{padding:12px}.lyrics{font-size:14px}}
</style>
</head>
<body>
<div class="app">
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>🎵 听歌悟单词</h1>
      <div class="stats" id="stats">加载中…</div>
    </div>
    <div class="search-box">
      <input type="text" id="search" placeholder="搜索歌名 / 歌手…">
    </div>
    <div class="song-list" id="songList"></div>
  </div>
  <div class="main">
    <div class="main-header">
      <h2 id="songTitle">请选择一首歌</h2>
      <div class="player-bar" id="playerBar"></div>
    </div>
    <div class="content" id="lyricsContent">
      <div class="empty">从左侧选择一首歌开始学习</div>
    </div>
  </div>
  <div class="vocab-panel">
    <div class="vocab-panel-header">
      <h3>歌词翻译</h3>
      <span class="count" id="vocabCount">逐句释义</span>
    </div>
    <div class="vocab-list" id="vocabList"></div>
  </div>
</div>
<div id="tooltip" class="tooltip" style="display:none"></div>
<script>
const DATA = ${dataJson};
const IRREGULAR = ${JSON.stringify(IRREGULAR)};
const WORDLIST = new Set(${JSON.stringify([...allWords])});

function normalizeInflection(lower) {
  const clean = lower.replace(/['']/g, '').toLowerCase();
  if (WORDLIST.has(clean)) return clean;
  if (IRREGULAR[clean]) { return IRREGULAR[clean]; }
  for (const suf of ["'re", "'ve", "'ll", "'m", "'d", "'s", "'t"]) {
    if (lower.endsWith(suf)) { const b = lower.slice(0, -suf.length); if (WORDLIST.has(b)) return b; }
  }
  const base = lower.replace(/[''].*$/, '');
  if (base !== lower && WORDLIST.has(base)) return base;
  const forms = [];
  if (lower.endsWith('ies')) forms.push(lower.slice(0, -3) + 'y');
  if (lower.endsWith('ves')) { forms.push(lower.slice(0, -3) + 'f'); forms.push(lower.slice(0, -3) + 'fe'); }
  if (lower.endsWith('es')) { forms.push(lower.slice(0, -2)); forms.push(lower.slice(0, -2) + 'e'); }
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us')) { forms.push(lower.slice(0, -1)); forms.push(lower.slice(0, -1) + 'e'); }
  if (lower.endsWith('ied')) forms.push(lower.slice(0, -3) + 'y');
  if (lower.endsWith('ed')) { const s = lower.slice(0, -2); forms.push(s, s + 'e', s + 'd'); }
  if (lower.endsWith('ing')) { const s = lower.slice(0, -3); forms.push(s, s + 'e', s + 'y', s + 't'); }
  if (lower.endsWith('ly')) forms.push(lower.slice(0, -2));
  for (const f of forms) if (WORDLIST.has(f)) return f;
  return null;
}

const NOISE = new Set(${JSON.stringify([...NOISE])});
function isNoise(w) { return NOISE.has(w.replace(/[''].*$/, '')); }

function highlightLyrics(text, wordMap) {
  const lines = text.split('\\n');
  return lines.map(line => {
    const parts = line.split(/([a-zA-Z]+'?[a-zA-Z']*)/g);
    return parts.map(part => {
      if (!part || !/[a-zA-Z]/.test(part)) return escapeHtml(part);
      const lower = part.toLowerCase();
      if (isNoise(lower)) return escapeHtml(part);
      const stem = normalizeInflection(lower);
      if (stem && wordMap[stem]) {
        return '<span class="v" data-t="' + escapeAttr(wordMap[stem]) + '" data-w="' + escapeAttr(stem) + '">' + escapeHtml(part) + '</span>';
      }
      return escapeHtml(part);
    }).join('');
  }).join('\\n');
}

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeAttr(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

let currentSong = null;

function renderSongList(filter) {
  const list = document.getElementById('songList');
  const f = (filter || '').toLowerCase();
  const filtered = DATA.songs.filter(s => !f || s.t.toLowerCase().includes(f) || s.a.toLowerCase().includes(f));
  list.innerHTML = filtered.map(s =>
    '<div class="song-item' + (currentSong && currentSong.id === s.id ? ' active' : '') + '" data-id="' + s.id + '">' +
    '<span class="song-num">' + String(s.id).padStart(2,'0') + '</span>' +
    '<div class="song-info"><div class="song-title">' + escapeHtml(s.t) + '</div><div class="song-artist">' + escapeHtml(s.a) + '</div></div>' +
    '<span class="song-words">' + s.n + '词</span>' +
    '</div>'
  ).join('');
  list.querySelectorAll('.song-item').forEach(el => {
    el.addEventListener('click', () => selectSong(parseInt(el.dataset.id)));
  });
}

function selectSong(id) {
  const song = DATA.songs.find(s => s.id === id);
  if (!song) return;
  currentSong = song;

  document.getElementById('songTitle').innerHTML = escapeHtml(song.t) + ' <span class="artist">— ' + escapeHtml(song.a) + '</span>';

  const q = encodeURIComponent(song.t + ' ' + song.a);
  document.getElementById('playerBar').innerHTML =
    '<a href="https://music.163.com/#/search?type=1&s=' + q + '" target="_blank">🎵 网易云</a>' +
    '<a href="https://y.qq.com/n/ryqq/search?w=' + q + '" target="_blank">🎵 QQ音乐</a>' +
    '<a href="https://www.youtube.com/results?search_query=' + q + '" target="_blank">▶ YouTube</a>';

  const content = document.getElementById('lyricsContent');
  content.innerHTML = '<div class="lyrics">' + highlightLyrics(song.l, song.w) + '</div>';

  content.querySelectorAll('.v').forEach(el => {
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', (e) => { e.stopPropagation(); showTooltip(e); });
  });

  const vocabList = document.getElementById('vocabList');
  const words = Object.entries(song.w).sort((a,b) => a[0].localeCompare(b[0]));
  document.getElementById('vocabCount').textContent = words.length + ' 词';
  const lyricsLines = song.l.split('\\n');
  vocabList.innerHTML = lyricsLines.map((line, i) => {
    if (!line.trim()) return '<div style="height:6px"></div>';
    return '<div class="trans-item" data-i="' + i + '"><div class="en">' + escapeHtml(line) + '</div><div class="zh loading">翻译中…</div></div>';
  }).join('');

  (async () => {
    const tasks = lyricsLines.map((line, i) => ({ line: line.trim(), i })).filter(x => x.line && /[a-zA-Z]/.test(x.line));
    for (let s = 0; s < tasks.length; s += 5) {
      await Promise.all(tasks.slice(s, s + 5).map(async ({ line, i }) => {
        const item = vocabList.querySelector('.trans-item[data-i="' + i + '"]');
        if (!item) return;
        try {
          const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(line) + '&langpair=en|zh-CN';
          const res = await fetch(url);
          const data = await res.json();
          const trans = (data.responseData && data.responseData.translatedText || '').replace(/\\n/g, ' ').trim();
          const zh = item.querySelector('.zh');
          zh.textContent = trans || '—';
          zh.classList.remove('loading');
        } catch (e) {
          const zh = item.querySelector('.zh');
          zh.textContent = '翻译失败';
          zh.classList.remove('loading');
        }
      }));
    }
  })();

  renderSongList(document.getElementById('search').value);
}

const tooltip = document.getElementById('tooltip');
function showTooltip(e) {
  const el = e.currentTarget;
  const w = el.dataset.w;
  const t = el.dataset.t;
  tooltip.innerHTML = '<div class="tw">' + escapeHtml(w) + '</div><div>' + escapeHtml(t) + '</div>';
  tooltip.style.display = 'block';
  const rect = el.getBoundingClientRect();
  let x = rect.left;
  let y = rect.bottom + 6;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  if (x + tw > window.innerWidth - 10) x = window.innerWidth - tw - 10;
  if (y + th > window.innerHeight - 10) y = rect.top - th - 6;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}
function hideTooltip() { tooltip.style.display = 'none'; }

document.getElementById('search').addEventListener('input', (e) => renderSongList(e.target.value));

document.getElementById('stats').textContent = DATA.songs.length + ' 首歌 · ' + DATA.totalUnique + ' 个独立词 · 覆盖 ' + DATA.coverage + '%';
renderSongList();
selectSong(DATA.songs[0].id);
</script>
</body>
</html>`;
}
