import test from 'node:test';
import assert from 'node:assert/strict';

test('public app files exist and never use localStorage for WaveSpeed', async()=>{
  const { readFile } = await import('node:fs/promises');
  const app = await readFile(new URL('../dist/app.js', import.meta.url),'utf8');
  assert.match(app,/sessionStorage\.setItem\('gisselegeo-wavespeed-key'/);
  assert.doesNotMatch(app,/localStorage/);
});

test('server bridge has a fixed model allowlist and no WaveSpeed env key', async()=>{
  const { readFile } = await import('node:fs/promises');
  const bridge = await readFile(new URL('../netlify/functions/wavespeed-bridge.mjs', import.meta.url),'utf8');
  assert.match(bridge,/seedream-v4\/edit/);
  assert.match(bridge,/seedance-2\.0-fast\/image-to-video/);
  assert.doesNotMatch(bridge,/process\.env\.WAVESPEED/);
  assert.doesNotMatch(bridge,/console\./);
});
