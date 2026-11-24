// Phenotype's population statistics: the mean and the standard deviation of every trait,
// measured on a folder of faces by the page's own code, in a real browser.
//
// The faces are synthetic (scripts/phenotype/make_population.py). Each one goes through
// exactly what a reader's photo goes through: assets/js/face-kit.js finds the face, crops
// it and reads the hair, and assets/js/phenotype-measure.js measures it. Running the
// page's code, not a Python port of it, means the statistics cannot drift from what the
// page computes.
//
// It drives Chrome through puppeteer-core, which is not a dependency of the site. Install
// it in any folder outside the repository and run this from there:
//
//     mkdir /tmp/phenotype-tools && cd /tmp/phenotype-tools && npm install puppeteer-core
//     node <site>/scripts/phenotype/statistics.mjs <folder of faces> [--write]
//
// Without --write it only prints the table; with it, assets/data/phenotype/population.json
// is rewritten. Statistics are taken on the faces within 15 degrees of frontal, where the
// measurement is at its best; the correlations with the head's pose are printed over all
// of them, and so is the comparison the page quotes: the same traits measured on the face
// turned to frontal, and as the camera saw it.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const SITE = new URL('../../', import.meta.url).pathname;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FRONTAL_DEGREES = 15;
const folder = process.argv[2];
if (!folder) { console.error('usage: node statistics.mjs <folder of faces> [--write]'); process.exit(2); }
const puppeteer = createRequire(process.cwd() + '/')('puppeteer-core');

const VENDOR = '/vendor/mediapipe/1.2.0/';
const PAGE = `<!doctype html><meta charset="utf-8"><title>statistics</title>
<script type="application/json" id="face-kit-sources">${JSON.stringify({
  bundle: VENDOR + 'vision_bundle.mjs', wasmLoader: VENDOR + 'wasm/vision_wasm_internal.js',
  wasmBinary: VENDOR + 'wasm/vision_wasm_internal.wasm', landmarker: VENDOR + 'models/face_landmarker.task',
  hair: VENDOR + 'models/hair_segmenter.tflite' })}</script>
<script src="/js/face-kit.js"></script><script src="/js/phenotype-measure.js"></script>
<script>
async function run(url) {
  const found = await FaceKit.find(await FaceKit.load(url));
  const crop = await FaceKit.align(found, { size: 512, scale: 1.5 });   // the page's own crop
  const hair = await FaceKit.hair(crop.image);
  const pixels = crop.image.getContext('2d').getImageData(0, 0, 512, 512);
  const measured = PhenotypeMeasure.measure(crop.points, pixels, hair);
  return { traits: measured.traits, pose: measured.pose, asSeen: PhenotypeMeasure.geometry(crop.points, true) };
}
</script>`;
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };
const roots = { '/vendor/': SITE + 'static/vendor/', '/js/': SITE + 'assets/js/', '/faces/': path.resolve(folder) + '/' };
const server = http.createServer((request, response) => {
  const url = decodeURIComponent(request.url.split('?')[0]);
  if (url === '/') { response.writeHead(200, { 'content-type': 'text/html' }); response.end(PAGE); return; }
  for (const [prefix, root] of Object.entries(roots)) {
    const file = path.join(root, url.slice(prefix.length));
    if (url.startsWith(prefix) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      response.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(response);
      return;
    }
  }
  response.writeHead(404); response.end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const data = [];
let refused = 0;
for (const file of fs.readdirSync(folder).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
  try { data.push(await page.evaluate(url => run(url), '/faces/' + file)); } catch (error) { refused++; }
}
await browser.close();
server.close();

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const deviation = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const correlation = (a, b) => {
  const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return n / Math.sqrt(da * db);
};
const frontal = data.filter(r => Math.abs(r.pose.yaw) <= FRONTAL_DEGREES && Math.abs(r.pose.pitch) <= FRONTAL_DEGREES);
console.log(`${data.length} faces measured (${refused} refused), ${frontal.length} within ${FRONTAL_DEGREES} degrees of frontal\n`);
const out = { faces: frontal.length, measured: data.length, traits: {} };
const yaw = r => Math.abs(r.pose.yaw), pitch = r => r.pose.pitch;
console.log('trait'.padEnd(12), 'mean'.padStart(9), 'std'.padStart(9), 'r(|yaw|)'.padStart(9), 'r(pitch)'.padStart(9));
for (const name of Object.keys(data[0].traits)) {
  const values = frontal.map(r => r.traits[name]).filter(Number.isFinite);
  const all = data.filter(r => Number.isFinite(r.traits[name]));
  out.traits[name] = { mean: +mean(values).toFixed(5), std: +deviation(values).toFixed(5) };
  console.log(name.padEnd(12), mean(values).toFixed(4).padStart(9), deviation(values).toFixed(4).padStart(9),
    correlation(all.map(yaw), all.map(r => r.traits[name])).toFixed(2).padStart(9),
    correlation(all.map(pitch), all.map(r => r.traits[name])).toFixed(2).padStart(9));
}
const landmarkTraits = Object.keys(data[0].asSeen);
const dependence = (pick, pose) => +mean(landmarkTraits.map(n => Math.abs(correlation(data.map(pose), data.map(r => pick(r)[n]))))).toFixed(3);
out.pose = {
  about: 'mean |correlation| between the 18 landmark traits and the head pose, over all measured faces',
  yawTurnedToFrontal: dependence(r => r.traits, yaw), yawAsSeen: dependence(r => r.asSeen, yaw),
  pitchTurnedToFrontal: dependence(r => r.traits, pitch), pitchAsSeen: dependence(r => r.asSeen, pitch)
};
console.log('\nmean |r| of the', landmarkTraits.length, 'landmark traits with the pose:');
console.log('  with |yaw|: turned to frontal', out.pose.yawTurnedToFrontal, ' as seen', out.pose.yawAsSeen);
console.log('  with pitch: turned to frontal', out.pose.pitchTurnedToFrontal, ' as seen', out.pose.pitchAsSeen);
if (process.argv.includes('--write')) {
  fs.writeFileSync(SITE + 'assets/data/phenotype/population.json', JSON.stringify(out, null, 1) + '\n');
  console.log('\nwrote assets/data/phenotype/population.json');
}
