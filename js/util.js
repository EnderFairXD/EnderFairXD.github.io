// Funciones puras compartidas: traducción, preferencias y resúmenes de repos.
(function () {
  const IDIOMAS = ['es', 'en'];

  function t(valor, idioma) {
    if (valor == null || typeof valor === 'string') return valor ?? '';
    return valor[idioma] ?? valor.es ?? '';
  }

  function idiomaInicial(guardado, navegador) {
    if (IDIOMAS.includes(guardado)) return guardado;
    return String(navegador || '').toLowerCase().startsWith('en') ? 'en' : 'es';
  }

  function leerPreferencia(almacen, clave) {
    try {
      return almacen ? almacen.getItem(clave) : null;
    } catch {
      return null;
    }
  }

  function guardarPreferencia(almacen, clave, valor) {
    try {
      if (almacen) almacen.setItem(clave, valor);
    } catch {
      // Modo privado o almacenamiento bloqueado: la preferencia no se recuerda.
    }
  }

  function unirProyectos(curados, repos) {
    const porNombre = new Map(repos.map((r) => [r.nombre, r]));
    return curados
      .filter((c) => porNombre.has(c.repo))
      .map((c) => ({ ...c, datos: porNombre.get(c.repo) }));
  }

  function contar(valores) {
    const cuenta = new Map();
    for (const v of valores) cuenta.set(v, (cuenta.get(v) || 0) + 1);
    return [...cuenta]
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
  }

  function resumenLenguajes(repos) {
    return contar(repos.map((r) => r.lenguaje).filter(Boolean));
  }

  function resumenTopics(repos, max = 12) {
    return contar(repos.flatMap((r) => r.topics || [])).slice(0, max);
  }

  const FECHA = /^\d{4}-\d{2}-\d{2}$/;
  const puntoValido = (p) => !!p && typeof p.fecha === 'string' && FECHA.test(p.fecha) && Number.isFinite(p.mejor);

  function historicoValido(datos) {
    if (!datos || typeof datos !== 'object') return false;
    return ['gesture', 'tygr'].every((k) => Array.isArray(datos[k]) && datos[k].every(puntoValido));
  }

  function seriePrecios(historico, producto) {
    const puntos = (historico && historico[producto]) || [];
    return puntos
      .filter(puntoValido)
      .map((p) => ({ fecha: p.fecha, precio: p.mejor }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  function formatearPrecio(valor, idioma) {
    return new Intl.NumberFormat(idioma === 'en' ? 'en-IE' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(valor);
  }

  // Qué proyectos resaltar según las áreas encendidas. Solo es "parcial" (y se marca)
  // cuando coinciden algunos pero no todos: resaltarlo todo no distingue nada.
  function resaltado(areasActivas, proyectos) {
    const repos = new Set(
      proyectos.filter((p) => p.areas.some((a) => areasActivas.has(a))).map((p) => p.repo),
    );
    return { repos, parcial: repos.size > 0 && repos.size < proyectos.length };
  }

  window.UTIL = {
    t, idiomaInicial, leerPreferencia, guardarPreferencia, unirProyectos,
    resumenLenguajes, resumenTopics, seriePrecios, formatearPrecio, historicoValido, resaltado,
  };
})();
