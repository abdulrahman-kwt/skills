// Renders a globe-motion film to MP4, frame by frame (so the result is identical on every machine).
//   node render.mjs film.html                      → film.mp4 (1080x1920, 30 fps)
//   node render.mjs film.html --stills 1,4.5,9     → check/sheet.png : a contact sheet of those seconds, cropped like an iPhone shows it
//   node render.mjs film.html --audio voice.wav    → adds the sound
//   options: --fps 30  --out name.mp4  --keep (keep the frames folder)  --cols 4 (stills per row in the sheet)
// Anything the film prints with console.log shows up here as "film: ..." (handy for reading computed values such as a route's stops).
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const film = args.find(a => a.endsWith('.html'));
if (!film) { console.error('usage: node render.mjs film.html [--stills 1,2,3] [--audio a.wav] [--fps 30] [--out out.mp4]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const root = path.dirname(path.resolve(film)), name = path.basename(film), base = name.replace(/\.html$/, '');
const fps = +opt('fps', 30), stills = opt('stills', null), audio = opt('audio', null), out = path.resolve(opt('out', path.join(root, base + '.mp4')));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.bin': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const gl = process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args: [...gl, '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => { if (m.type() === 'error') console.log('page error:', m.text()); else if (m.type() === 'log') console.log('film:', m.text()); });
page.on('pageerror', e => console.log('page error:', e.message));
await page.goto(`http://127.0.0.1:${port}/${encodeURIComponent(name)}`);
let failed = null; page.on('pageerror', e => { failed = e.message; });
for (let i = 0; i < 600 && !failed; i++) { if (await page.evaluate('window.READY===true')) break; await new Promise(r => setTimeout(r, 200)); if (i === 599) failed = 'the film never set window.READY'; }
if (failed) { console.error('film failed to start:', failed); await browser.close(); server.close(); process.exit(1); }
const dur = await page.evaluate('window.DUR');
const run = (a) => { const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', ...a], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };

if (stills) {
  const dir = path.join(root, 'check'); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^s\d+\.png$/.test(f)) fs.rmSync(path.join(dir, f));
  const ts = stills.split(',').map(Number); let i = 0;
  for (const t of ts) { await page.evaluate(`window.renderAt(${t})`); await page.screenshot({ path: path.join(dir, `s${String(i++).padStart(3, '0')}.png`) }); }
  const cols = Math.min(+opt('cols', 4), ts.length), rows = Math.ceil(ts.length / cols);
  // crop=887:1920:96:0 is what an iPhone actually shows of a reel
  run(['-framerate', '1', '-i', path.join(dir, 's%03d.png'), '-vf', `crop=887:1920:96:0,scale=400:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(dir, 'sheet.png')]);
  console.log('sheet:', path.join(dir, 'sheet.png'), '| seconds:', ts.join(', '), '| film length:', dur);
} else {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'globe-motion-')); const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    await page.evaluate(`window.renderAt(${i / fps})`);
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
    if (i % 60 === 0) console.log(`frame ${i}/${n}`);
  }
  const a = ['-framerate', String(fps), '-i', path.join(dir, 'f%05d.jpg')];
  if (audio) a.push('-i', path.resolve(audio));
  a.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p');
  if (audio) a.push('-c:a', 'aac', '-b:a', '224k', '-shortest');
  a.push('-movflags', '+faststart', out); run(a);
  if (!args.includes('--keep')) fs.rmSync(dir, { recursive: true, force: true });
  console.log('video:', out, `(${n} frames, ${dur}s)`);
}
await browser.close(); server.close();
