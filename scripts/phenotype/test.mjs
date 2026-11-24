// The doll's pure logic, tested in Node: `node scripts/phenotype/test.mjs` from the site's root.
// No dependencies. The page itself (photo in, doll out) is tested in a browser; see the README.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = new URL('../../', import.meta.url).pathname;
const M = require(root + 'assets/js/phenotype-measure.js');
const G = require(root + 'assets/js/phenotype-genome.js');
const D = require(root + 'assets/js/phenotype-draw.js');
const population = JSON.parse(fs.readFileSync(root + 'assets/data/phenotype/population.json'));
const { points } = JSON.parse(fs.readFileSync(root + 'scripts/phenotype/fixtures/landmarks.json'));

let seed = 42;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function randomGenome() {
  const genome = G.resident();
  for (const gene of G.SCALARS) genome.genes[gene[0]] = random();
  for (const colour of G.COLOURS) genome.colours[colour[0]] = [0.2 + 0.7 * random(), 0.2 * random() - 0.1, 0.2 * random() - 0.1];
  genome.generation = Math.floor(random() * 500);
  return genome;
}
const tests = [];
const test = (name, run) => tests.push([name, run]);

test('colour: sRGB -> OKLab -> sRGB is the identity', () => {
  for (const rgb of [[0, 0, 0], [255, 255, 255], [200, 120, 80], [12, 200, 77], [90, 59, 38]]) {
    assert.deepEqual(M.oklabToRgb(M.rgbToOklab(...rgb)), rgb);
  }
});

test('measure: every population trait is measured on the fixture, and is a finite number', () => {
  const traits = M.geometry(points);
  for (const gene of G.SCALARS.filter(g => g[2] === 'z' && !g[0].startsWith('hair'))) {
    assert.ok(Number.isFinite(traits[gene[0]]), gene[0]);
    assert.ok(population.traits[gene[0]], 'no statistics for ' + gene[0]);
  }
});

test('measure: turning the head does not change the measurements', () => {
  // The same 3D points, turned 20 degrees about the vertical axis, nodded 10 and tilted 8.
  const turn = (p, yaw, pitch, roll) => {
    let [x, y, z] = p;
    [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
    [x, y] = [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll)];
    return [x, y, z];
  };
  const rad = d => d * Math.PI / 180;
  const before = M.geometry(points), after = M.geometry(points.map(p => turn(p, rad(20), rad(10), rad(8))));
  for (const name of Object.keys(before)) assert.ok(Math.abs(before[name] - after[name]) < 1e-9, name);
  const pose = M.pose(points.map(p => turn(p, rad(20), 0, 0))), rest = M.pose(points);
  assert.ok(Math.abs(Math.abs(pose.yaw - rest.yaw) - 20) < 0.5, 'yaw is read back');
});

test('genome: 40 bytes, 54 characters, and the link gives back the same doll', () => {
  for (let i = 0; i < 200; i++) {
    const genome = randomGenome(), code = G.encode(genome);
    assert.equal(code.length, 54);
    assert.match(code, /^[A-Za-z0-9_-]+$/);
    assert.equal(G.encode(G.decode(code)), code);
    assert.equal(G.decode(code).generation, genome.generation);
  }
});

test('genome: anything that is not a genome is refused, not drawn', () => {
  for (const text of ['', 'hello', 'A'.repeat(54), G.encode(G.resident()).slice(0, 40), '<script>', null, undefined]) {
    assert.equal(G.decode(text), null);
  }
});

test('inherit: three whole groups from each parent, the skin halfway, one more generation', () => {
  for (let i = 0; i < 100; i++) {
    const doll = randomGenome(), visitor = randomGenome();
    const { child, from } = G.inherit(doll, visitor);
    const shaped = G.GROUPS.filter(g => g !== 'skin');
    assert.equal(shaped.filter(g => from[g] === 'visitor').length, 3);
    assert.equal(shaped.filter(g => from[g] === 'doll').length, 3);
    for (const gene of G.SCALARS) assert.equal(child.genes[gene[0]], (from[gene[1]] === 'visitor' ? visitor : doll).genes[gene[0]]);
    for (const k of [0, 1, 2]) assert.ok(Math.abs(child.colours.skin[k] - (doll.colours.skin[k] + visitor.colours.skin[k]) / 2) < 1e-12);
    assert.deepEqual(child.colours.eye, (from.eyes === 'visitor' ? visitor : doll).colours.eye);
    assert.deepEqual(child.colours.hair, (from.hair === 'visitor' ? visitor : doll).colours.hair);
    assert.equal(child.generation, doll.generation + 1);
  }
});

test('inherit: the same two parents always have the same child; every group is taken about half the time', () => {
  const doll = randomGenome(), visitor = randomGenome();
  assert.equal(G.encode(G.inherit(doll, visitor).child), G.encode(G.inherit(doll, visitor).child));
  const taken = {};
  for (let i = 0; i < 2000; i++) {
    const { from } = G.inherit(randomGenome(), randomGenome());
    for (const g of G.GROUPS) if (from[g] === 'visitor') taken[g] = (taken[g] || 0) + 1;
  }
  for (const g of G.GROUPS.filter(g => g !== 'skin')) assert.ok(Math.abs(taken[g] / 2000 - 0.5) < 0.05, g + ' ' + taken[g]);
});

test('inherit: the words name exactly the groups', () => {
  const { from } = G.inherit(G.resident(), randomGenome());
  const words = G.inheritedWords(from, 'visitor');
  for (const g of G.GROUPS) assert.equal(words.includes(G.GROUP_WORDS[g]), from[g] === 'visitor', g);
});

test('colours: whatever is sampled, the doll gets a colour inside its range', () => {
  for (let i = 0; i < 500; i++) {
    const lab = [random(), random() - 0.5, random() - 0.5];
    const skin = G.skinColour(lab);
    assert.ok(skin[0] >= 0.36 && skin[0] <= 0.90);
    const hue = Math.atan2(skin[2], skin[1]) * 180 / Math.PI;
    assert.ok(hue >= 30 - 1e-9 && hue <= 78 + 1e-9, 'skin hue ' + hue);
    assert.ok(G.hairColour(lab)[0] >= 0.20);
    assert.ok(G.eyeColour(lab)[0] >= 0.30 && G.eyeColour(lab)[0] <= 0.68);
  }
  assert.ok(G.skinColour(null) && G.hairColour(null) && G.eyeColour(null));
});

const WEAR = [{}, { glasses: true }, { beard: 0.4 }, { glasses: true, beard: 1 }];

test('draw: every genome draws, whatever is worn, eyes open or shut, with no NaN and nothing active', () => {
  const genomes = [G.resident()];
  for (let i = 0; i < 300; i++) genomes.push(randomGenome());
  // The corners of gene space too: every gene at 0, every gene at 1.
  for (const v of [0, 1]) { const g = G.resident(); for (const gene of G.SCALARS) g.genes[gene[0]] = v; genomes.push(g); }
  genomes.forEach((genome, index) => {
    const svg = D.svg(genome, { wear: WEAR[index % WEAR.length], blink: index % 2 === 1 });
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.ok(!/NaN|undefined|Infinity/.test(svg), G.encode(genome));
    assert.ok(!/<script|onload|href/i.test(svg), 'nothing active in the drawing');
  });
});

test('draw: two drawings on one page never share an id, and a blink only changes the eyes', () => {
  const genome = randomGenome();
  const ids = text => [...text.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  const first = D.svg(genome, {}), second = D.svg(genome, {});
  assert.equal(ids(first).filter(id => ids(second).includes(id)).length, 0);
  const strip = text => text.replace(/ph\d+/g, 'ph');
  assert.equal(strip(first), strip(second));
  assert.notEqual(strip(first), strip(D.svg(genome, { blink: true })));
});

test('draw: what is worn shows on the doll and is not in the genome', () => {
  const genome = G.fromMeasurement({ traits: M.geometry(points), colours: { skin: null, hair: null, iris: null, lips: null } }, population);
  const strip = text => text.replace(/ph\d+/g, 'ph');
  const bare = strip(D.svg(genome, { scheme: 0 }));
  for (const wear of [{ glasses: true }, { beard: 1 }]) assert.ok(strip(D.svg(genome, { scheme: 0, wear })).length > bare.length + 40, JSON.stringify(wear));
  // No hair mask was given: the hair genes fall back to "like most people", never to NaN.
  for (const gene of G.SCALARS) assert.ok(genome.genes[gene[0]] >= 0 && genome.genes[gene[0]] <= 1, gene[0]);
});

test('specimens: every doll written in specimens.json is a genome', () => {
  const dolls = JSON.parse(fs.readFileSync(root + 'assets/data/phenotype/specimens.json'));
  assert.ok(dolls.length >= 6);
  for (const doll of dolls) assert.ok(G.decode(doll.code), doll.from);
});

let failed = 0;
for (const [name, run] of tests) {
  try { run(); console.log('ok   ' + name); } catch (error) { failed++; console.log('FAIL ' + name + '\n     ' + error.message); }
}
console.log(failed ? failed + ' of ' + tests.length + ' failed' : 'all ' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
