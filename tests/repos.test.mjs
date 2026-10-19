import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const { REPOS } = cargar(['js/repos.js']);

test('repos.js incluye los repos públicos', () => {
  assert.equal(REPOS.usuario, 'EnderFairXD');
  assert.ok(REPOS.repos.length >= 10, `solo hay ${REPOS.repos.length}`);
  assert.match(REPOS.generado, /^\d{4}-\d{2}-\d{2}$/);
});

test('repos.js no contiene repos privados ni el de perfil', () => {
  const nombres = REPOS.repos.map((r) => r.nombre);
  for (const prohibido of ['telegrafo-de-bolsillo', 'nfc-toolkit', 'EnderFairXD']) {
    assert.ok(!nombres.includes(prohibido), `aparece ${prohibido}`);
  }
});

test('cada repo tiene la forma esperada', () => {
  for (const r of REPOS.repos) {
    assert.equal(typeof r.nombre, 'string');
    assert.equal(typeof r.url, 'string');
    assert.ok(Array.isArray(r.lenguajes), `${r.nombre}.lenguajes`);
    assert.ok(Array.isArray(r.topics), `${r.nombre}.topics`);
    assert.ok(r.descripcion === null || typeof r.descripcion === 'string');
    assert.ok(r.lenguaje === null || typeof r.lenguaje === 'string');
  }
});

test('precios.js trae una copia del histórico del rastreador', () => {
  const { PRECIOS } = cargar(['js/precios.js']);
  assert.match(PRECIOS.generado, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(PRECIOS.fuente, 'https://enderfairxd.github.io/rastreador-de-precios/historico.json');
  for (const producto of ['gesture', 'tygr']) {
    assert.ok(PRECIOS.historico[producto].length > 0, producto);
    for (const p of PRECIOS.historico[producto]) {
      assert.match(p.fecha, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(typeof p.mejor, 'number');
    }
  }
});
