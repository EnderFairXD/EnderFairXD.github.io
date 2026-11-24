import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { raiz } from './cargar.mjs';

// Cada CSS/JS se enlaza con ?v=<huella de su contenido>, para que el navegador no use una copia vieja.
test('index.html enlaza cada CSS y JS con la huella de su contenido actual', () => {
  const html = readFileSync(raiz + 'index.html', 'utf8');
  const enlaces = [...html.matchAll(/(?:href|src)="((?:css|js)\/[^"?]+)(?:\?v=([0-9a-f]+))?"/g)];
  assert.ok(enlaces.length >= 6, 'faltan enlaces a CSS/JS');
  for (const [, archivo, version] of enlaces) {
    const huella = createHash('sha256').update(readFileSync(raiz + archivo)).digest('hex').slice(0, 10);
    assert.equal(version, huella, `${archivo}: ejecuta ./versionar.sh`);
  }
});
