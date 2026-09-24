import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'lyrics');
fs.mkdirSync(OUT, { recursive: true });

const SONGS = [
  { id: 1, artist: 'The Carpenters', title: 'Yesterday Once More' },
  { id: 2, artist: 'Simon & Garfunkel', title: 'The Sound of Silence' },
  { id: 3, artist: 'The Beatles', title: 'Hey Jude' },
  { id: 4, artist: 'Celine Dion', title: 'My Heart Will Go On' },
  { id: 5, artist: 'Brian Hyland', title: 'Sealed with a Kiss' },
  { id: 6, artist: 'Michael Jackson', title: 'You Are Not Alone' },
  { id: 7, artist: 'Daniel Powter', title: 'Free Loop' },
  { id: 8, artist: "Fool's Garden", title: 'Lemon Tree' },
  { id: 9, artist: 'Emilia', title: 'Big Big World' },
  { id: 10, artist: 'OneRepublic', title: 'Apologize' },
  { id: 11, artist: 'Eagles', title: 'Hotel California' },
  { id: 12, artist: 'Bob Dylan', title: "Blowin' in the Wind" },
  { id: 13, artist: 'Sarah Brightman', title: 'Scarborough Fair' },
  { id: 14, artist: 'The Innocence Mission', title: '500 Miles' },
  { id: 15, artist: 'Westlife', title: 'The Rose' },
  { id: 16, artist: 'Westlife', title: 'My Love' },
  { id: 17, artist: 'Whitney Houston', title: 'I Will Always Love You' },
  { id: 18, artist: 'Wiz Khalifa', title: 'See You Again' },
  { id: 19, artist: 'Idina Menzel', title: 'Let It Go' },
  { id: 20, artist: 'Miguel', title: 'Remember Me' },
  { id: 21, artist: 'Taylor Swift', title: 'Love Story' },
  { id: 22, artist: 'Taylor Swift', title: 'You Belong with Me' },
  { id: 23, artist: 'Taylor Swift', title: 'Shake It Off' },
  { id: 24, artist: 'Taylor Swift', title: 'Everything Has Changed' },
  { id: 25, artist: 'Ed Sheeran', title: 'Perfect' },
  { id: 26, artist: 'Ed Sheeran', title: 'Shape of You' },
  { id: 27, artist: 'Ed Sheeran', title: 'Thinking Out Loud' },
  { id: 28, artist: 'Ed Sheeran', title: 'Bad Habits' },
  { id: 29, artist: 'Mariah Carey', title: 'Hero' },
  { id: 30, artist: 'Westlife', title: 'You Raise Me Up' },
  { id: 31, artist: 'Louis Armstrong', title: 'What a Wonderful World' },
  { id: 32, artist: 'Mariah Carey', title: 'When You Believe' },
  { id: 33, artist: 'Rachel Platten', title: 'Fight Song' },
  { id: 34, artist: 'Kelly Clarkson', title: 'Because of You' },
  { id: 35, artist: 'Sarah Connor', title: 'Just One Last Dance' },
  { id: 36, artist: 'Eric Clapton', title: 'Tears in Heaven' },
  { id: 37, artist: 'John Legend', title: 'All of Me' },
  { id: 38, artist: 'Adele', title: 'Someone Like You' },
  { id: 39, artist: 'John Denver', title: 'Take Me Home, Country Roads' },
  { id: 40, artist: 'The Cascades', title: 'Rhythm of the Rain' },
  { id: 41, artist: 'Darin Zanyar', title: "B What U Wanna B" },
  { id: 42, artist: 'James Blunt', title: "You're Beautiful" },
  { id: 43, artist: 'Fiona Fung', title: 'Proud of You' },
  { id: 44, artist: 'Fiona Fung', title: 'A Little Love' },
  { id: 45, artist: 'Bruno Mars', title: 'Count on Me' },
];

const q = (s) => encodeURIComponent(s);
const get = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': 'song-vocab-tool/1.0' } });
  if (!r.ok) return null;
  return r.json();
};

const pad = (n) => String(n).padStart(2, '0');

for (const s of SONGS) {
  const f = path.join(OUT, `${pad(s.id)}.json`);
  if (fs.existsSync(f)) { console.log(`SKIP ${s.id} ${s.title}`); continue; }
  const candidate = await get(`https://lrclib.net/api/get?artist_name=${q(s.artist)}&track_name=${q(s.title)}`);
  let rec = candidate;
  if (!candidate || !candidate.plainLyrics) {
    const found = await get(`https://lrclib.net/api/search?q=${q(`${s.title} ${s.artist}`)}&track_name=${q(s.title)}`);
    rec = (found || []).find(f2 => f2.plainLyrics || f2.syncedLyrics) || null;
  }
  if (!rec) {
    console.log(`MISS ${s.id} ${s.artist} - ${s.title}`);
    fs.writeFileSync(f, JSON.stringify({ id: s.id, artist: s.artist, title: s.title, ok: false }, null, 2));
    continue;
  }
  const out = {
    id: s.id, artist: s.artist, title: s.title, ok: true,
    plainLyrics: rec.plainLyrics || '', syncedLyrics: rec.syncedLyrics || '',
    name: rec.name, albumName: rec.albumName, duration: rec.duration,
  };
  fs.writeFileSync(f, JSON.stringify(out, null, 2));
  console.log(`OK  ${s.id} ${s.title} (${(out.plainLyrics || '').split('\n').length} lines)`);
  await new Promise(r => setTimeout(r, 350));
}

console.log('DONE');