import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { raiz } from './cargar.mjs';

function generarPrecios(contenido) {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-'));
  const fuente = join(dir, 'historico.json');
  writeFileSync(fuente, contenido);
  const r = spawnSync('bash', [join(raiz, 'actualizar-repos.sh')], {
    env: { ...process.env, SOLO: 'precios', SALIDA: dir, FUENTE_PRECIOS: `file://${fuente}` },
    encoding: 'utf8',
  });
  return { r, dir };
}

test('el generador falla y no escribe precios.js si el histórico no es válido', () => {
  const { r, dir } = generarPrecios('{"gesture": "no es una lista", "tygr": []}');
  assert.notEqual(r.status, 0);
  assert.ok(!existsSync(join(dir, 'precios.js')), 'no debe quedar un precios.js roto');
});

test('el generador escribe precios.js con un histórico válido', () => {
  const { r, dir } = generarPrecios('{"gesture": [{"fecha": "2026-10-01", "mejor": 10, "tienda": "X", "tiendas": {}}], "tygr": []}');
  assert.equal(r.status, 0, r.stderr);
  const texto = readFileSync(join(dir, 'precios.js'), 'utf8');
  assert.match(texto, /window\.PRECIOS = \{/);
  assert.match(texto, /"mejor": 10/);
});
