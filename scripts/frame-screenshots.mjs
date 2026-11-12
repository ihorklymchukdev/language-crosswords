// Renders store/screenshots/{ios,android}-N.png from raw/ captures + frame.html.
// Drives Chrome over CDP: headless --window-size keeps ~90px for browser UI, so the viewport
// would come out shorter than the image.
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const dir = resolve(import.meta.dirname, '../store/screenshots');
const SIZES = { ios: [1320, 2868], android: [1080, 1920] };
const template = pathToFileURL(join(dir, 'frame.html'));
const chromePath = process.env.CHROME ?? 'google-chrome';

const profile = mkdtempSync(join(tmpdir(), 'frame-chrome-'));
const chrome = spawn(
  chromePath,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: 'ignore' },
);

try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

  const raws = readdirSync(join(dir, 'raw')).filter((f) => /^(ios|android)-\d+\.png$/.test(f)).sort();
  for (const raw of raws) {
    const [, store, n] = raw.match(/^(ios|android)-(\d+)\.png$/);
    const [width, height] = SIZES[store];
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    template.search = `?store=${store}&n=${n}`;
    await send('Page.navigate', { url: template.href });
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      await sleep(100);
      ready = await evaluate(
        `document.readyState === 'complete' && document.getElementById('shot')?.naturalWidth > 0 &&
         document.fonts.check('800 40px Gabarito') && document.fonts.check('500 40px Onest')`,
      ).catch(() => false);
    }
    // A missing COPY entry or font leaves the page half-built; never save that.
    if (!ready) throw new Error(`${raw}: frame did not finish loading (COPY entry for ${n}? fonts?)`);
    await sleep(200);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
    writeFileSync(join(dir, `${store}-${n}.png`), Buffer.from(data, 'base64'));
    console.log(`${store}-${n}.png`);
  }
  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
