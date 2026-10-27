import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { cargar, raiz } from './cargar.mjs';

const { DATOS, REPOS } = cargar(['js/repos.js', 'js/datos.js']);
const nombresRepos = new Set(REPOS.repos.map((r) => r.nombre));
const AREAS = ['backend', 'movil', 'ia', 'datos-gis', 'sistemas', 'ciber'];
const DESTACADOS = ['GEOgis-SimpleWeb', 'portapapeles-universal-p2p', 'STUDYBRAIN-AI', 'rastreador-de-precios', 'boveda-garantias'];

function recorrer(valor, ruta, visitar) {
  if (valor && typeof valor === 'object') {
    visitar(valor, ruta);
    for (const [k, v] of Object.entries(valor)) recorrer(v, `${ruta}.${k}`, visitar);
  }
}

test('todo texto bilingüe tiene versión es y en no vacías', () => {
  const incompletos = [];
  recorrer(DATOS, 'DATOS', (obj, ruta) => {
    if ('es' in obj || 'en' in obj) {
      const ok = typeof obj.es === 'string' && obj.es.trim() && typeof obj.en === 'string' && obj.en.trim();
      if (!ok) incompletos.push(ruta);
    }
  });
  assert.deepEqual(incompletos, []);
});

test('las áreas son exactamente las seis acordadas', () => {
  assert.deepEqual([...DATOS.areas.map((a) => a.id)], AREAS);
});

test('los destacados son los cinco acordados y en orden', () => {
  assert.deepEqual([...DATOS.destacados.map((d) => d.repo)], DESTACADOS);
});

test('todo repo citado existe entre los públicos', () => {
  const citados = [...DATOS.areas.flatMap((a) => a.repos), ...DATOS.destacados.map((d) => d.repo)];
  assert.deepEqual(citados.filter((n) => !nombresRepos.has(n)), []);
});

test('las áreas de los destacados son ids válidos', () => {
  for (const d of DATOS.destacados) {
    assert.ok(d.areas.length > 0, d.repo);
    for (const a of d.areas) assert.ok(AREAS.includes(a), `${d.repo}: ${a}`);
  }
});

// Patrones genéricos (sin datos reales dentro): teléfono español, calle y código postal.
const TELEFONO = /(?<![\w-])(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/;
const CALLE = /\b(calle|c\/|avda\.?|avenida|plaza)\s+\S/i;
const CODIGO_POSTAL = /\b(?:0[1-9]|[1-4]\d|5[0-2])\d{3}\b/;

test('no se publica teléfono ni dirección en ningún archivo de la web', () => {
  const archivos = ['index.html', 'js/datos.js', 'js/app.js', 'README.md'];
  for (const archivo of archivos) {
    const texto = readFileSync(raiz + archivo, 'utf8');
    for (const [nombre, patron] of Object.entries({ TELEFONO, CALLE, CODIGO_POSTAL })) {
      assert.ok(!patron.test(texto), `${archivo}: ${nombre} → ${texto.match(patron)?.[0]}`);
    }
  }
});

test('la foto y los CV enlazados existen', () => {
  const p = DATOS.persona;
  for (const archivo of [p.foto, p.cv.es, p.cv.en]) assert.ok(existsSync(raiz + archivo), archivo);
});

test('otros cubre los repos públicos no destacados con áreas válidas', () => {
  const otros = [...DATOS.otros.map((o) => o.repo)];
  assert.deepEqual([...otros.filter((n) => !nombresRepos.has(n))], []);
  const cubiertos = new Set([...otros, ...DESTACADOS]);
  assert.deepEqual([...nombresRepos].filter((n) => !cubiertos.has(n)), []);
  for (const o of DATOS.otros) {
    assert.ok(o.areas.length > 0, o.repo);
    for (const a of o.areas) assert.ok(AREAS.includes(a), `${o.repo}: ${a}`);
  }
});

test('cada destacado tiene nombre corto y al menos una cifra', () => {
  for (const d of DATOS.destacados) {
    assert.ok(d.nombre, d.repo);
    assert.ok(d.cifras.length > 0, d.repo);
  }
});

test('cada aportación de código abierto enlaza a GitHub y dice qué tipo de aportación es', () => {
  assert.ok(DATOS.codigoAbierto.length > 0);
  for (const c of DATOS.codigoAbierto) {
    assert.match(c.url, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(issues|pull)\/\d+/);
    assert.ok(['informe', 'codigo', 'documentacion'].includes(c.tipo), c.tipo);
    assert.match(c.fecha, /^\d{4}-\d{2}$/);
  }
});
