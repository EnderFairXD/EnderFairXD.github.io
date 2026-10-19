import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargar } from './cargar.mjs';

const { UTIL } = cargar(['js/util.js']);
// Los objetos creados dentro del vm tienen otro prototipo: se aplanan para compararlos.
const plano = (x) => JSON.parse(JSON.stringify(x));

test('t traduce objetos y deja pasar textos', () => {
  assert.equal(UTIL.t({ es: 'Hola', en: 'Hi' }, 'en'), 'Hi');
  assert.equal(UTIL.t({ es: 'Hola', en: 'Hi' }, 'es'), 'Hola');
  assert.equal(UTIL.t({ es: 'Hola' }, 'en'), 'Hola');
  assert.equal(UTIL.t('Python', 'en'), 'Python');
});

test('idiomaInicial prioriza lo guardado y si no el navegador', () => {
  assert.equal(UTIL.idiomaInicial(null, 'en-GB'), 'en');
  assert.equal(UTIL.idiomaInicial(null, 'es-ES'), 'es');
  assert.equal(UTIL.idiomaInicial('es', 'en-US'), 'es');
  assert.equal(UTIL.idiomaInicial('en', 'es-ES'), 'en');
  assert.equal(UTIL.idiomaInicial('fr', 'fr-FR'), 'es');
  assert.equal(UTIL.idiomaInicial(null, undefined), 'es');
});

test('leerPreferencia devuelve null si el almacenamiento falla', () => {
  assert.equal(UTIL.leerPreferencia({ getItem() { throw new Error('bloqueado'); } }, 'x'), null);
  assert.equal(UTIL.leerPreferencia(undefined, 'x'), null);
  assert.equal(UTIL.leerPreferencia({ getItem: (k) => (k === 'x' ? 'y' : null) }, 'x'), 'y');
});

test('guardarPreferencia no lanza si el almacenamiento falla', () => {
  assert.doesNotThrow(() => UTIL.guardarPreferencia({ setItem() { throw new Error('lleno'); } }, 'x', 'y'));
  assert.doesNotThrow(() => UTIL.guardarPreferencia(undefined, 'x', 'y'));
  const guardado = {};
  UTIL.guardarPreferencia({ setItem: (k, v) => { guardado[k] = v; } }, 'x', 'y');
  assert.deepEqual(guardado, { x: 'y' });
});

test('unirProyectos omite repos que ya no existen', () => {
  const r = UTIL.unirProyectos([{ repo: 'a', extra: 1 }, { repo: 'zz' }], [{ nombre: 'a' }, { nombre: 'b' }]);
  assert.equal(r.length, 1);
  assert.equal(r[0].datos.nombre, 'a');
  assert.equal(r[0].extra, 1);
});

test('resumenLenguajes cuenta el lenguaje principal e ignora null', () => {
  const r = UTIL.resumenLenguajes([{ lenguaje: 'Python' }, { lenguaje: 'Python' }, { lenguaje: null }, { lenguaje: 'Dart' }]);
  assert.deepEqual(plano(r), [{ nombre: 'Python', cantidad: 2 }, { nombre: 'Dart', cantidad: 1 }]);
});

test('resumenTopics ordena por frecuencia, desempata alfabéticamente y respeta max', () => {
  const repos = [{ topics: ['python', 'expo'] }, { topics: ['python', 'ai'] }, { topics: ['expo', 'zz'] }, { topics: [] }];
  assert.deepEqual(plano(UTIL.resumenTopics(repos, 3)), [
    { nombre: 'expo', cantidad: 2 },
    { nombre: 'python', cantidad: 2 },
    { nombre: 'ai', cantidad: 1 },
  ]);
  assert.equal(UTIL.resumenTopics(repos).length, 4);
});

test('seriePrecios ordena por fecha y descarta puntos sin precio', () => {
  const historico = { silla: [
    { fecha: '2026-10-03', mejor: 12 },
    { fecha: '2026-10-01', mejor: 10 },
    { fecha: '2026-10-02', mejor: null },
  ] };
  assert.deepEqual(plano(UTIL.seriePrecios(historico, 'silla')), [
    { fecha: '2026-10-01', precio: 10 },
    { fecha: '2026-10-03', precio: 12 },
  ]);
  assert.deepEqual(plano(UTIL.seriePrecios(historico, 'otro')), []);
  assert.deepEqual(plano(UTIL.seriePrecios(null, 'silla')), []);
});

test('formatearPrecio usa el formato de cada idioma en euros', () => {
  assert.equal(UTIL.formatearPrecio(1058.6, 'es').replace(/\s/g, ' '), '1058,60 €');
  assert.equal(UTIL.formatearPrecio(1058.6, 'en'), '€1,058.60');
});

test('historicoValido acepta el formato del rastreador', () => {
  const bueno = { gesture: [{ fecha: '2026-10-01', mejor: 10.5, tienda: 'X' }], tygr: [] };
  assert.equal(UTIL.historicoValido(bueno), true);
});

test('historicoValido rechaza entradas mal formadas', () => {
  const casos = [
    null,
    'texto',
    { gesture: [] },
    { gesture: [null], tygr: [] },
    { gesture: [{ mejor: 10 }], tygr: [] },
    { gesture: [{ fecha: '1/10/2026', mejor: 10 }], tygr: [] },
    { gesture: [{ fecha: '2026-10-01', mejor: 'diez' }], tygr: [] },
    { gesture: [{ fecha: '2026-10-01', mejor: Infinity }], tygr: [] },
  ];
  for (const c of casos) assert.equal(UTIL.historicoValido(c), false, JSON.stringify(c));
});

test('seriePrecios ignora entradas nulas o con fecha inválida', () => {
  const historico = { silla: [null, { fecha: 'ayer', mejor: 5 }, { fecha: '2026-10-02', mejor: 7 }] };
  assert.deepEqual(plano(UTIL.seriePrecios(historico, 'silla')), [{ fecha: '2026-10-02', precio: 7 }]);
});

test('resaltado marca solo cuando coincide una parte de los proyectos', () => {
  const proyectos = [{ repo: 'a', areas: ['ia'] }, { repo: 'b', areas: ['movil'] }, { repo: 'c', areas: ['ia', 'movil'] }];
  const parcial = UTIL.resaltado(new Set(['ia']), proyectos);
  assert.equal(parcial.parcial, true);
  assert.deepEqual([...parcial.repos].sort(), ['a', 'c']);

  const todos = UTIL.resaltado(new Set(['ia', 'movil']), proyectos);
  assert.equal(todos.parcial, false);
  assert.equal(todos.repos.size, 3);

  const ninguno = UTIL.resaltado(new Set(), proyectos);
  assert.equal(ninguno.parcial, false);
  assert.equal(ninguno.repos.size, 0);
});
