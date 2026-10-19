# Portfolio · Javier Cortés Vidal

Web personal que hace de portfolio y de CV extendido: trayectoria, conocimientos por áreas y
proyectos de GitHub contados por dentro. Bilingüe (español / inglés), con tema claro y oscuro.

Es HTML, CSS y JavaScript sin frameworks ni compilación.

## Verla en local

Los datos se cargan con JavaScript, así que se puede abrir `index.html` con doble clic. Para que la
gráfica del rastreador lea los precios en directo, mejor servirla:

```bash
python3 -m http.server 8642
```

y abrir <http://localhost:8642>.

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` | Esqueleto de la página y versión sin JavaScript |
| `css/estilos.css` | Colores, tipografía, maquetación, temas y movimiento |
| `js/datos.js` | **Todo el texto** de la web en español e inglés: editar aquí |
| `js/repos.js` | Datos de los repos públicos (generado, no editar) |
| `js/precios.js` | Copia del histórico del rastreador de precios (generado, no editar) |
| `js/util.js` | Funciones puras: idioma, preferencias, resúmenes y precios |
| `js/app.js` | Monta las secciones, idioma, tema, interruptores y gráfica |
| `assets/` | Foto, CV en PDF (sin teléfono) y capturas de GEOgis |
| `tests/` | Tests con el runner de Node |

## Editar el contenido

Todo lo que se lee en la página está en `js/datos.js`. Cada texto traducible es un objeto
`{ es: '…', en: '…' }`; los tests comprueban que ninguno se quede sin traducir.

- **Proyectos destacados:** `destacados` (problema, solución, decisiones, cifras y fragmento visual).
- **Resto de repos:** `otros`. Si creas un repo público nuevo, añádelo aquí con su área o los tests fallarán.
- **Áreas de conocimiento:** `areas` (la frase del interruptor, el resumen y los repos que lo demuestran).

## Actualizar los datos de GitHub

Necesita `gh` con sesión iniciada y `jq`:

```bash
./actualizar-repos.sh
npm test
```

Regenera `js/repos.js` (solo repos públicos) y `js/precios.js`.

## Tests

```bash
npm test
```

Comprueban, entre otras cosas, que no se publica ningún repo privado, que todos los textos tienen
versión en los dos idiomas, que los repos citados existen y que no aparece teléfono ni dirección.

## Publicar en GitHub Pages

Sube el repositorio y activa Pages en *Settings → Pages → Deploy from a branch* (rama principal,
carpeta raíz). No hace falta ningún paso de compilación.

## Créditos

Los mapas de las capturas de GEOgis son © colaboradores de OpenStreetMap. Tipografías: Newsreader
(Google Fonts) para titulares y cifras; IBM Plex Sans para el texto pequeño.
