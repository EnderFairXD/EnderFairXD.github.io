// Monta la página a partir de DATOS (textos), REPOS (GitHub) y PRECIOS (copia del rastreador).
(function () {
  'use strict';

  const { DATOS, REPOS, PRECIOS, UTIL } = window;
  const raiz = document.documentElement;
  const almacen = (() => {
    try { return window.localStorage; } catch { return null; }
  })();

  const estado = {
    idioma: UTIL.idiomaInicial(UTIL.leerPreferencia(almacen, 'idioma'), navigator.language),
    encendidas: new Set(['backend', 'sistemas']),
    producto: 'gesture',
    historico: PRECIOS.historico,
    preciosEnDirecto: false,
  };

  const reposPorNombre = new Map(REPOS.repos.map((r) => [r.nombre, r]));
  const destacados = UTIL.unirProyectos(DATOS.destacados, REPOS.repos);
  const otros = UTIL.unirProyectos(DATOS.otros, REPOS.repos);
  const proyectos = [
    ...destacados.map((d) => ({ ...d, href: `#proyecto-${d.repo}` })),
    ...otros.map((o) => ({ ...o, href: o.datos.url, externo: true })),
  ];

  // ---------------------------------------------------------------- utilidades
  const $ = (selector, ambito = document) => ambito.querySelector(selector);
  const $$ = (selector, ambito = document) => [...ambito.querySelectorAll(selector)];
  const escapar = (texto) =>
    String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const tr = (valor) => escapar(UTIL.t(valor, estado.idioma));
  const ui = (clave, variables = {}) => {
    let texto = UTIL.t(DATOS.interfaz[clave], estado.idioma);
    for (const [k, v] of Object.entries(variables)) texto = texto.replace(`{${k}}`, v);
    return escapar(texto);
  };
  const locale = () => (estado.idioma === 'en' ? 'en-GB' : 'es-ES');
  const fecha = (iso) =>
    new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));
  const externo = 'target="_blank" rel="noopener noreferrer"';
  const nombreDe = (repo) => {
    const p = proyectos.find((x) => x.repo === repo);
    return p ? tr(p.nombre) : escapar(repo);
  };
  const hrefDe = (repo) => {
    const p = proyectos.find((x) => x.repo === repo);
    return p ? p.href : `${DATOS.persona.github}/${repo}`;
  };
  const revelar = (i) => `data-revelar style="--r:${i}"`;

  // ---------------------------------------------------------------- secciones
  function portada() {
    const p = DATOS.persona;
    const lineas = p.titular
      .map((l, i) => `<span class="linea"><span data-linea style="--i:${i}">${tr(l)}</span></span>`)
      .join(' ');
    return `
      <h1 class="titular" id="titular">${lineas}</h1>
      <div class="portada__pie">
        <p class="portada__frase">${tr(p.presentacion)}</p>
        <a class="boton" href="#proyectos">${ui('verProyectos')} <span class="flecha" aria-hidden="true">↓</span></a>
      </div>`;
  }

  function sobreMi() {
    const p = DATOS.persona;
    const datos = DATOS.datosRapidos
      .map((d) => `<div><dt>${tr(d.etiqueta)}</dt><dd>${tr(d.valor)}</dd></div>`)
      .join('');
    const parrafos = DATOS.sobreMi.map((t, i) => `<p ${revelar(i + 1)}>${tr(t)}</p>`).join('');
    return `
      <div class="sobre-mi__lado" ${revelar(0)}>
        <img class="retrato" src="${p.foto}" alt="${ui('fotoAlt')}" width="720" height="960" loading="lazy">
        <dl class="datos-rapidos">${datos}</dl>
      </div>
      <div class="sobre-mi__texto">
        <h2 class="vh" id="titulo-sobre-mi">${ui('sobreMi')}</h2>
        ${parrafos}
      </div>`;
  }

  function trayectoria() {
    const fila = (e, i) => {
      const hasta = UTIL.t(e.hasta, estado.idioma);
      const periodo = `${tr(e.desde)}–${escapar(hasta)}${e.cursando ? ` · ${ui('cursando')}` : ''}`;
      const detalle = e.detalle.length
        ? `<ul class="fila__detalle">${e.detalle.map((d) => `<li>${tr(d)}</li>`).join('')}</ul>`
        : '';
      return `
        <li class="fila" ${revelar(i)}>
          <span class="fila__punto fila__punto--${e.tipo}" aria-hidden="true"></span>
          <span class="fila__nombre"><strong>${tr(e.titulo)}</strong><br><span class="fila__lugar">${escapar(e.lugar)}</span></span>
          <span class="fila__valor tabular">${periodo}</span>
          ${detalle}
        </li>`;
    };
    const grupo = (tipo, clave) => `
      <div class="grupo">
        <h3 class="grupo__nombre">${ui(clave)}</h3>
        <ul>${DATOS.trayectoria.filter((e) => e.tipo === tipo).map(fila).join('')}</ul>
      </div>`;
    return `
      <div class="trayectoria__columna">
        <h2 class="titulo-medio" id="titulo-trayectoria" ${revelar(0)}>${ui('trayectoria')}</h2>
        <div class="trayectoria__grupos">
          ${grupo('experiencia', 'experiencia')}
          ${grupo('formacion', 'formacion')}
        </div>
      </div>`;
  }

  function conocimientos() {
    const bandas = DATOS.areas
      .map((a) => {
        const on = estado.encendidas.has(a.id);
        const repos = a.repos
          .map((r) => `<a href="${hrefDe(r)}"${hrefDe(r).startsWith('#') ? '' : ` ${externo}`}>${nombreDe(r)}</a>`)
          .join(', ');
        return `
          <div class="banda" data-area="${a.id}" data-encendida="${on}">
            <div class="banda__fila">
              <p class="banda__frase" id="frase-${a.id}">${tr(a.frase)}</p>
              <button type="button" class="interruptor" role="switch" data-ui data-interruptor="${a.id}"
                aria-checked="${on}" aria-labelledby="frase-${a.id}" aria-controls="detalle-${a.id}"></button>
            </div>
            <div class="banda__detalle" id="detalle-${a.id}"${on ? '' : ' inert'}>
              <div>
                <div class="banda__cuerpo">
                  <div>
                    <h3 class="banda__area">${tr(a.titulo)}</h3>
                    <p>${tr(a.resumen)}</p>
                  </div>
                  <div class="banda__meta">
                    <div><h4>${ui('tecnologias')}</h4><p translate="no">${a.tecnologias.map(escapar).join(' · ')}</p></div>
                    <div><h4>${ui('loDemuestran')}</h4><p>${repos}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
      })
      .join('');
    return `
      <div class="conocimientos__cabeza">
        <h2 class="titulo-medio" id="titulo-conocimientos" ${revelar(0)}>${ui('conocimientos')}</h2>
        <p ${revelar(1)}>${ui('conocimientosIntro')}</p>
      </div>
      ${bandas}`;
  }

  function nombresDeProyectos() {
    const enlaces = proyectos.map((p, i) => {
      const marco =
        p.repo === 'GEOgis-SimpleWeb'
          ? '<span class="marco" aria-hidden="true"><img src="assets/proyectos/geogis-ficha.jpg" alt="" width="900" height="426" loading="lazy"></span>'
          : '';
      const separador = i === proyectos.length - 1 ? '.' : '<span class="sep">,</span> ';
      return `<a href="${p.href}" data-repo="${p.repo}"${p.externo ? ` ${externo}` : ''}>${tr(p.nombre)}</a>${marco}${separador}`;
    });
    const anios = REPOS.repos.map((r) => r.creado.slice(0, 4)).sort();
    return `
      <h2 class="proyectos__titulo" id="titulo-proyectos" ${revelar(0)}>${ui('proyectos')}</h2>
      <p class="nombres" ${revelar(1)}>${enlaces.join('')}</p>
      <div class="proyectos__pie">
        <p>${ui('recuento', { total: REPOS.repos.length, desde: anios[0], hasta: anios[anios.length - 1] })}</p>
        <p id="estado-resaltado" aria-live="polite"></p>
      </div>`;
  }

  function cabeceraDestacado(d) {
    const demo = d.datos.web
      ? `<a href="${d.datos.web}" ${externo}>${ui('verDemo')} ↗</a>`
      : '';
    return `
      <h3 class="destacado__titulo" id="t-${d.repo}">${tr(d.titulo)}</h3>
      <p class="destacado__stack" translate="no">${d.stack.map(escapar).join(' · ')}</p>
      <div class="destacado__enlaces">
        <a href="${d.datos.url}" ${externo}>${ui('verCodigo')} ↗</a>
        ${demo}
      </div>`;
  }

  function relato(d) {
    return `
      <div class="relato">
        <div ${revelar(1)}><h4>${ui('problema')}</h4><p>${tr(d.problema)}</p></div>
        <div ${revelar(2)}><h4>${ui('solucion')}</h4><p>${tr(d.solucion)}</p></div>
        <div ${revelar(3)}>
          <h4>${ui('decisiones')}</h4>
          <ul class="decisiones">${d.decisiones.map((x) => `<li>${tr(x)}</li>`).join('')}</ul>
        </div>
      </div>`;
  }

  function cifras(d) {
    return `<div class="cifras" ${revelar(2)}>${d.cifras
      .map((c) => `<p><span class="cifra__valor">${escapar(c.valor)}</span><span class="cifra__etiqueta">${tr(c.etiqueta)}</span></p>`)
      .join('')}</div>`;
  }

  function fragmento(d) {
    const f = d.fragmento;
    if (f.tipo === 'transportes') {
      const filas = f.elementos
        .map(
          (e, i) => `
          <li class="${e.listo === true ? '' : 'pendiente'}">
            <span class="orden">${i + 1}</span>
            <span>${tr(e.nombre)}</span>
            <span class="estado${e.listo === true ? '' : ' estado--pendiente'}">${ui(e.listo === true ? 'implementado' : e.listo === 'probando' ? 'sinProbar' : 'pendiente')}</span>
          </li>`,
        )
        .join('');
      return `<h4>${ui('transportes')}</h4><ol class="transportes">${filas}</ol>`;
    }
    if (f.tipo === 'flujo') {
      return `<h4>${ui('flujo')}</h4><ol class="flujo">${f.pasos.map((p) => `<li>${tr(p)}</li>`).join('')}</ol>`;
    }
    if (f.tipo === 'precios') {
      const chips = [
        ['gesture', 'silla'],
        ['tygr', 'auriculares'],
      ]
        .map(
          ([id, clave]) =>
            `<button type="button" class="chip" data-producto="${id}" aria-pressed="${estado.producto === id}">${ui(clave)}</button>`,
        )
        .join('');
      return `
        <h4>${ui('precioTitulo')}</h4>
        <div class="precios__controles" role="group" aria-label="${ui('precioTitulo')}">${chips}</div>
        <div class="precios__grafica" id="grafica-precios"></div>
        <p class="precios__nota" id="nota-precios" aria-live="polite"></p>
        <table class="vh" id="tabla-precios"></table>`;
    }
    return '';
  }

  function destacadosHtml() {
    return destacados
      .map((d, i) => {
        if (d.fragmento.tipo === 'capturas') {
          // Cada captura existe a tamaño normal y a doble densidad (@2x).
          const img = (nombre, clave, ancho, alto, ancho2x, tamanos) => `
            <img src="assets/proyectos/${nombre}.jpg" alt="${ui(clave)}" width="${ancho}" height="${alto}" loading="lazy"
              srcset="assets/proyectos/${nombre}.jpg ${ancho}w, assets/proyectos/${nombre}@2x.jpg ${ancho2x}w" sizes="${tamanos}">`;
          const fig = (clase, nombre, clave, ancho, alto, ancho2x, tamanos) => `
            <figure class="${clase}">
              ${img(nombre, clave, ancho, alto, ancho2x, tamanos)}
              <figcaption>${ui(clave)}</figcaption>
            </figure>`;
          return `
            <section class="destacado destacado--capturas" id="proyecto-${d.repo}" aria-labelledby="t-${d.repo}">
              <figure class="lienzo" ${revelar(0)}>
                ${img('geogis-mapa', 'capturaMapa', 1440, 637, 2880, '100vw')}
              </figure>
              <div class="disposicion">
                <div class="disposicion__cabeza" ${revelar(0)}>${cabeceraDestacado(d)}${cifras(d)}</div>
                ${relato(d)}
              </div>
              <div class="galeria" aria-label="${ui('capturas')}" ${revelar(1)}>
                ${fig('galeria__ficha', 'geogis-ficha', 'capturaFicha', 900, 426, 1596, '(max-width: 900px) 100vw, 60vw')}
                ${fig('galeria__simulacion', 'geogis-simulacion', 'capturaSimulacion', 900, 637, 1800, '(max-width: 900px) 100vw, 40vw')}
                ${fig('galeria__cobertura', 'geogis-cobertura', 'capturaCobertura', 900, 398, 1800, '100vw')}
              </div>
            </section>`;
        }
        return `
          <section class="destacado destacado--lado${i % 2 ? ' invertido' : ''}" id="proyecto-${d.repo}" aria-labelledby="t-${d.repo}">
            <div class="disposicion">
              <div>
                <div ${revelar(0)}>${cabeceraDestacado(d)}</div>
                ${relato(d)}
                ${cifras(d)}
              </div>
              <aside class="fragmento" data-ui ${revelar(1)}>${fragmento(d)}</aside>
            </div>
          </section>`;
      })
      .join('');
  }

  function otrosHtml() {
    const filas = otros
      .map((o, i) => {
        const r = o.datos;
        return `
          <li class="otro" data-repo="${o.repo}" ${revelar(i % 2)}>
            <h3 class="otro__nombre"><a href="${r.url}" ${externo}>${tr(o.nombre)}</a></h3>
            <span class="otro__lenguaje">${escapar(r.lenguaje || '')}</span>
            <p class="otro__desc">${tr(o.descripcion)}</p>
            <p class="otro__temas" translate="no">${r.topics.map(escapar).join(' · ')}</p>
          </li>`;
      })
      .join('');
    return `
      <h2 class="titulo-medio otros__titulo" id="titulo-otros" ${revelar(0)}>${ui('otros')}</h2>
      <ul class="otros__lista">${filas}</ul>`;
  }

  function codigoAbiertoHtml() {
    const tipos = { informe: 'tipoInforme', codigo: 'tipoCodigo', documentacion: 'tipoDocumentacion' };
    const filas = DATOS.codigoAbierto
      .map(
        (c, i) => `
        <li class="aporte" ${revelar(i + 1)}>
          <div class="aporte__cabeza">
            <p class="aporte__proyecto">${escapar(c.proyecto)} · <span translate="no">${escapar(c.repo)}</span></p>
            <p class="aporte__meta">${ui(tipos[c.tipo])} · ${escapar(c.fecha)}</p>
          </div>
          <h3 class="aporte__titulo">${tr(c.titulo)}</h3>
          <p class="aporte__resumen">${tr(c.resumen)}</p>
          <p class="aporte__pie"><span translate="no">${c.tecnologias.map(escapar).join(' · ')}</span>
            <a href="${escapar(c.url)}" ${externo}>${ui('verAportacion')} ↗</a></p>
        </li>`,
      )
      .join('');
    return `
      <h2 class="titulo-medio" id="titulo-codigo-abierto" ${revelar(0)}>${ui('codigoAbierto')}</h2>
      <div class="codigo-abierto__cuerpo">
        <p class="codigo-abierto__intro" ${revelar(0)}>${ui('codigoAbiertoIntro')}</p>
        <ul class="aportes">${filas}</ul>
      </div>`;
  }

  function numeros() {
    const lenguajes = new Set(REPOS.repos.flatMap((r) => r.lenguajes));
    const temas = new Set(REPOS.repos.flatMap((r) => r.topics));
    const filas = [
      [REPOS.repos.length, 'cifraRepos'],
      [lenguajes.size, 'cifraLenguajes'],
      [temas.size, 'cifraTemas'],
      [DATOS.areas.length, 'cifraAreas'],
    ]
      .map(
        ([n, clave], i) =>
          `<p class="libro__fila" ${revelar(i)}><span class="libro__cifra">${n}</span><span class="libro__texto">${ui(clave)}</span></p>`,
      )
      .join('');
    const porLenguaje = UTIL.resumenLenguajes(REPOS.repos);
    const maximo = Math.max(...porLenguaje.map((l) => l.cantidad));
    const barras = porLenguaje
      .map(
        (l, i) => `
        <li class="barra" title="${escapar(l.nombre)}: ${l.cantidad} ${ui(l.cantidad === 1 ? 'repo' : 'repos')}">
          <span>${escapar(l.nombre)}</span>
          <span class="barra__pista"><span class="barra__relleno" style="width:${(l.cantidad / maximo) * 100}%;--b:${i}"></span></span>
          <span class="barra__valor">${l.cantidad}</span>
        </li>`,
      )
      .join('');
    const chips = UTIL.resumenTopics(REPOS.repos, 14)
      .map((t) => `<li>${escapar(t.nombre)}<span class="n">${t.cantidad}</span></li>`)
      .join('');
    const [l1, l2] = DATOS.interfaz.numerosTitulo;
    return `
      <h2 class="numeros__titulo" id="titulo-numeros" ${revelar(0)}><span>${tr(l1)}</span><span>${tr(l2)}</span></h2>
      <div class="libro">${filas}</div>
      <div class="numeros__graficas">
        <div class="barras" ${revelar(0)}><h3>${ui('lenguajePrincipal')}</h3><ul>${barras}</ul></div>
        <div class="temas" ${revelar(1)}><h3>${ui('temas')}</h3><ul class="temas__lista">${chips}</ul></div>
      </div>`;
  }

  function mailto() {
    return `mailto:${DATOS.persona.email}?subject=${encodeURIComponent(UTIL.t(DATOS.interfaz.asuntoCorreo, estado.idioma))}`;
  }

  function contacto() {
    const p = DATOS.persona;
    const flecha = '<span class="flechita" aria-hidden="true">↗</span>';
    return `
      <h2 class="vh" id="titulo-contacto">${ui('contacto')}</h2>
      <p class="contacto__fila"><a href="${p.linkedin}" ${externo}>LinkedIn</a>${flecha}</p>
      <p class="contacto__fila"><a href="${p.github}" ${externo}>GitHub</a>${flecha}</p>
      <p class="contacto__fila"><a href="${UTIL.t(p.cv, estado.idioma)}" download>${ui('descargarCv')}</a><span class="flechita" aria-hidden="true">↓</span></p>
      <p class="contacto__fila">${tr(p.ubicacion)}</p>
      <p class="contacto__fila contacto__saludo">
        <span>${ui('hola')}</span>
        <a class="boton-redondo" href="${mailto()}" aria-label="${ui('escribeme')}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>
        </a>
      </p>`;
  }

  function pie() {
    const p = DATOS.persona;
    const [usuario, dominio] = p.email.split('@');
    return `
      <div class="pie__arriba">
        <div class="pie__notas">
          <p class="marca-pie">${escapar(p.nombre)}</p>
          <p>${ui('notaPie')}</p>
          <p>${tr(p.ubicacion)}</p>
        </div>
        <a href="#inicio">${ui('volverArriba')} ↑</a>
      </div>
      <div></div>
      <a class="pie__correo" href="${mailto()}" translate="no"><span>${escapar(usuario)}</span><span>@${escapar(dominio)}</span></a>
      <div class="pie__meta">
        <p class="enlaces">
          <a href="${p.github}" ${externo}>GitHub</a>
          <a href="${p.linkedin}" ${externo}>LinkedIn</a>
          <a href="${UTIL.t(p.cv, estado.idioma)}" download>CV</a>
        </p>
        <p>${ui('hechoAMano')}</p>
        <p>${ui('datosGithub', { fecha: fecha(REPOS.generado) })}</p>
      </div>`;
  }

  // ---------------------------------------------------------------- gráfica de precios
  function dibujarPrecios() {
    try {
      pintarPrecios();
    } catch {
      // Datos inesperados: mejor sin gráfica que sin página.
      const contenedor = $('#grafica-precios');
      if (contenedor) contenedor.innerHTML = '';
    }
  }

  function pintarPrecios() {
    const contenedor = $('#grafica-precios');
    if (!contenedor) return;
    const serie = UTIL.seriePrecios(estado.historico, estado.producto);
    const nota = $('#nota-precios');
    const tabla = $('#tabla-precios');
    if (serie.length < 2) {
      contenedor.innerHTML = '';
      nota.textContent = '';
      return;
    }
    const an = 600, al = 240, izq = 64, der = 18, arr = 14, abj = 30;
    const tiempos = serie.map((p) => Date.parse(`${p.fecha}T12:00:00`));
    const t0 = tiempos[0], t1 = tiempos[tiempos.length - 1];
    const precios = serie.map((p) => p.precio);
    let min = Math.min(...precios), max = Math.max(...precios);
    const margen = Math.max((max - min) * 0.25, max * 0.01);
    min -= margen; max += margen;
    const x = (t) => izq + ((t - t0) / Math.max(t1 - t0, 1)) * (an - izq - der);
    const y = (v) => arr + (1 - (v - min) / (max - min)) * (al - arr - abj);
    const formato = (v) => UTIL.formatearPrecio(v, estado.idioma);
    const marcas = [0, 0.5, 1].map((f) => min + (max - min) * f);
    const camino = serie.map((p, i) => `${i ? 'L' : 'M'}${x(tiempos[i]).toFixed(1)},${y(p.precio).toFixed(1)}`).join('');
    const ultimo = serie[serie.length - 1];
    contenedor.innerHTML = `
      <svg viewBox="0 0 ${an} ${al}" role="img" aria-label="${ui('precioTitulo')}">
        <g class="rejilla">${marcas.map((v) => `<line x1="${izq}" x2="${an - der}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
        <g class="eje">
          ${marcas.map((v) => `<text x="${izq - 10}" y="${y(v) + 4}" text-anchor="end">${escapar(formato(v).replace(/[,.]\d\d(?=\D*$)/, ''))}</text>`).join('')}
          <text x="${izq}" y="${al - 6}">${escapar(fecha(serie[0].fecha))}</text>
          <text x="${an - der}" y="${al - 6}" text-anchor="end">${escapar(fecha(ultimo.fecha))}</text>
        </g>
        <path class="serie" d="${camino}"/>
        <circle class="punto-final" r="5" cx="${x(t1)}" cy="${y(ultimo.precio)}"/>
        <g class="cursor" hidden><line y1="${arr}" y2="${al - abj}"/><circle r="5"/></g>
      </svg>
      <div class="precios__aviso" hidden></div>`;

    const svg = $('svg', contenedor);
    const cursor = $('.cursor', svg);
    const aviso = $('.precios__aviso', contenedor);
    const mover = (evento) => {
      const caja = svg.getBoundingClientRect();
      const px = ((evento.clientX - caja.left) / caja.width) * an;
      let i = 0;
      for (let k = 1; k < serie.length; k++) if (Math.abs(x(tiempos[k]) - px) < Math.abs(x(tiempos[i]) - px)) i = k;
      const cx = x(tiempos[i]), cy = y(serie[i].precio);
      cursor.hidden = false;
      $('line', cursor).setAttribute('x1', cx);
      $('line', cursor).setAttribute('x2', cx);
      $('circle', cursor).setAttribute('cx', cx);
      $('circle', cursor).setAttribute('cy', cy);
      aviso.hidden = false;
      aviso.textContent = `${fecha(serie[i].fecha)} · ${formato(serie[i].precio)}`;
      aviso.style.left = `${(cx / an) * 100}%`;
      aviso.style.top = `calc(${(cy / al) * 100}% - 12px)`;
    };
    const salir = () => { cursor.hidden = true; aviso.hidden = true; };
    svg.addEventListener('pointermove', mover);
    svg.addEventListener('pointerdown', mover);
    svg.addEventListener('pointerleave', salir);

    const crudo = [...(estado.historico[estado.producto] || [])].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const tienda = crudo.length ? crudo[crudo.length - 1].tienda : '';
    const origen = estado.preciosEnDirecto ? ui('enDirecto') : ui('copiaLocal', { fecha: fecha(PRECIOS.generado) });
    nota.innerHTML = `${ui('ultimaLectura', { fecha: fecha(ultimo.fecha), precio: formato(ultimo.precio), tienda: escapar(tienda || '') }).replace(escapar(formato(ultimo.precio)), `<strong>${escapar(formato(ultimo.precio))}</strong>`)} ${origen}`;
    tabla.innerHTML = `<caption>${ui('tablaPrecios')}</caption><thead><tr><th>${ui('fecha')}</th><th>${ui('precio')}</th></tr></thead><tbody>${serie
      .map((p) => `<tr><td>${escapar(fecha(p.fecha))}</td><td>${escapar(formato(p.precio))}</td></tr>`)
      .join('')}</tbody>`;
  }

  async function cargarPreciosEnDirecto() {
    if (!('fetch' in window)) return;
    const control = 'AbortController' in window ? new AbortController() : null;
    const espera = setTimeout(() => control && control.abort(), 6000);
    try {
      const respuesta = await fetch(PRECIOS.fuente, { cache: 'no-store', signal: control && control.signal });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      if (UTIL.historicoValido(datos)) {
        estado.historico = datos;
        estado.preciosEnDirecto = true;
        dibujarPrecios();
      }
    } catch {
      // Sin conexión o bloqueado: se queda la copia guardada.
    } finally {
      clearTimeout(espera);
    }
  }

  // ---------------------------------------------------------------- resaltado por áreas
  function actualizarResaltado() {
    const { repos, parcial } = UTIL.resaltado(estado.encendidas, proyectos);
    const nombres = $('.nombres');
    nombres.dataset.filtrando = parcial;
    for (const a of $$('a[data-repo]', nombres)) a.classList.toggle('resaltado', parcial && repos.has(a.dataset.repo));
    const lista = $('#otros');
    lista.dataset.filtrando = parcial;
    for (const o of $$('.otro', lista)) o.classList.toggle('resaltado', parcial && repos.has(o.dataset.repo));

    const titulos = DATOS.areas.filter((a) => estado.encendidas.has(a.id)).map((a) => UTIL.t(a.titulo, estado.idioma));
    $('#estado-resaltado').textContent = titulos.length
      ? `${UTIL.t(DATOS.interfaz.resaltando, estado.idioma)}: ${titulos.join(', ')} · ${repos.size} ${UTIL.t(DATOS.interfaz.deProyectos, estado.idioma).replace('{total}', proyectos.length)}`
      : UTIL.t(DATOS.interfaz.ningunaArea, estado.idioma);
  }

  function alternarArea(id) {
    if (estado.encendidas.has(id)) estado.encendidas.delete(id);
    else estado.encendidas.add(id);
    const on = estado.encendidas.has(id);
    const banda = $(`.banda[data-area="${id}"]`);
    banda.dataset.encendida = on;
    $('.interruptor', banda).setAttribute('aria-checked', on);
    $('.banda__detalle', banda).toggleAttribute('inert', !on);
    actualizarResaltado();
  }

  // ---------------------------------------------------------------- cabecera, idioma y tema
  function temaActual() {
    if (raiz.dataset.theme) return raiz.dataset.theme;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function actualizarCabecera() {
    raiz.lang = estado.idioma;
    for (const el of $$('[data-texto]')) el.textContent = UTIL.t(DATOS.interfaz[el.dataset.texto], estado.idioma);
    $('[data-cv]').href = UTIL.t(DATOS.persona.cv, estado.idioma);
    const botonIdioma = $('[data-accion="idioma"]');
    botonIdioma.textContent = UTIL.t(DATOS.interfaz.otroIdioma, estado.idioma);
    botonIdioma.setAttribute('aria-label', UTIL.t(DATOS.interfaz.otroIdiomaEtiqueta, estado.idioma));
    botonIdioma.setAttribute('lang', estado.idioma === 'es' ? 'en' : 'es');
    const botonTema = $('[data-accion="tema"]');
    botonTema.textContent = UTIL.t(DATOS.interfaz[temaActual() === 'dark' ? 'temaClaro' : 'temaOscuro'], estado.idioma);
    botonTema.setAttribute('aria-label', UTIL.t(DATOS.interfaz.temaEtiqueta, estado.idioma));
  }

  // ---------------------------------------------------------------- entradas al hacer scroll
  let observador = null;
  function prepararEntradas(primeraVez) {
    const elementos = $$('[data-revelar]');
    const sinMovimiento = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!primeraVez || sinMovimiento || !('IntersectionObserver' in window)) {
      elementos.forEach((el) => el.classList.add('visible'));
      return;
    }
    document.body.classList.add('revelar-listo');
    observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observador.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    elementos.forEach((el) => observador.observe(el));
  }

  // ---------------------------------------------------------------- render
  function render(primeraVez) {
    if (observador) observador.disconnect();
    if (!primeraVez) raiz.classList.add('sin-entrada');
    $('#inicio').innerHTML = portada();
    $('#sobre-mi').innerHTML = sobreMi();
    $('#trayectoria').innerHTML = trayectoria();
    $('#conocimientos').innerHTML = conocimientos();
    $('#proyectos').innerHTML = nombresDeProyectos();
    $('#destacados').innerHTML = destacadosHtml();
    $('#otros').innerHTML = otrosHtml();
    $('#codigo-abierto').innerHTML = codigoAbiertoHtml();
    $('#numeros').innerHTML = numeros();
    $('#contacto').innerHTML = contacto();
    $('#pie').innerHTML = pie();
    actualizarCabecera();
    actualizarResaltado();
    prepararEntradas(primeraVez);
    dibujarPrecios();
  }

  document.addEventListener('click', (evento) => {
    const interruptor = evento.target.closest('[data-interruptor]');
    if (interruptor) return alternarArea(interruptor.dataset.interruptor);

    const chip = evento.target.closest('[data-producto]');
    if (chip) {
      estado.producto = chip.dataset.producto;
      $$('[data-producto]').forEach((c) => c.setAttribute('aria-pressed', c === chip));
      return dibujarPrecios();
    }

    const accion = evento.target.closest('[data-accion]');
    if (!accion) return;
    if (accion.dataset.accion === 'idioma') {
      estado.idioma = estado.idioma === 'es' ? 'en' : 'es';
      UTIL.guardarPreferencia(almacen, 'idioma', estado.idioma);
      render(false);
    } else if (accion.dataset.accion === 'tema') {
      const nuevo = temaActual() === 'dark' ? 'light' : 'dark';
      raiz.dataset.theme = nuevo;
      UTIL.guardarPreferencia(almacen, 'tema', nuevo === 'dark' ? 'oscuro' : 'claro');
      actualizarCabecera();
    }
  });

  try {
    render(true);
    raiz.classList.add('listo');
    cargarPreciosEnDirecto();
  } catch (error) {
    raiz.classList.add('fallo');
    throw error;
  }
})();
