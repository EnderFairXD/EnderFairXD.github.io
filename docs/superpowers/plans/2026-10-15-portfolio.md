# Portfolio / CV extendido — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web estática bilingüe (ES/EN) que presenta a Javier Cortés Vidal como técnico híbrido sistemas + desarrollo, con trayectoria, conocimientos a fondo y proyectos de GitHub.

**Architecture:** `index.html` con secciones vacías que `js/app.js` rellena a partir de dos fuentes: `js/datos.js` (textos curados, editables a mano) y `js/repos.js` (generado por `actualizar-repos.sh` desde `gh`). La lógica pura vive en `js/util.js` y se prueba en Node con `vm`; la presentación se verifica en el navegador integrado.

**Tech Stack:** HTML, CSS, JS vanilla (sin build), Google Fonts, Bash + `gh` + `jq`, `node --test` (Node 20) para tests.

**Spec:** `docs/superpowers/specs/2026-10-15-portfolio-design.md`

## Global Constraints

- Sin backend ni compilación; debe funcionar servido estáticamente (GitHub Pages) y con `python3 -m http.server`.
- Bilingüe ES/EN; ES por defecto salvo `navigator.language` que empiece por `en`; elección guardada en `localStorage` clave `idioma`.
- Tema claro/oscuro: sigue `prefers-color-scheme`, conmutable, guardado en `localStorage` clave `tema`.
- Solo repos públicos. Prohibido en cualquier archivo publicado: teléfono y dirección postal.
- Contacto: `cortesvidaljavier00@gmail.com`, LinkedIn `https://www.linkedin.com/in/javier-cort%C3%A9s-vidal-915942361`, GitHub `https://github.com/EnderFairXD`.
- Destacados (en este orden): `GEOgis-SimpleWeb`, `portapapeles-universal-p2p`, `STUDYBRAIN-AI`, `rastreador-de-precios`, `boveda-garantias`.
- Áreas (ids): `backend`, `movil`, `ia`, `datos-gis`, `sistemas`, `ciber`.
- Sin barras de porcentaje de habilidades. Contraste AA, foco visible, `prefers-reduced-motion`, responsive desde 360 px sin scroll horizontal.
- Commits solo a nombre de Javier, sin líneas de coautoría.

## Review Focus

1. **JS desactivado o fallo al cargar datos** → la página no queda en blanco: `<noscript>` con nombre, rol y enlaces de contacto/CV (Task 4).
2. **`localStorage` lanza excepción** (modo privado) → idioma y tema funcionan igual, sin errores (test en Task 2: `leerPreferencia` con almacenamiento que lanza).
3. **Repo de `datos.js` borrado o renombrado tras regenerar `repos.js`** → se omite sin romper el render (test en Task 2: `unirProyectos` con repo inexistente).
4. **Repo sin descripción, sin lenguaje o sin topics** → se muestra sin `undefined`/`null` (test en Task 2: `resumenLenguajes` ignora `null`; test en Task 1 de forma del JSON).
5. **Elementos animados al hacer scroll que nunca se revelan** (reduced-motion, impresión, sin IntersectionObserver) → todo el contenido visible (Task 5, verificación con `prefers-reduced-motion` y `@media print`).

---

### Task 1: Generador de repos

**Files:**
- Create: `actualizar-repos.sh`, `js/repos.js` (generado), `tests/cargar.mjs`, `tests/repos.test.mjs`, `package.json` (solo `{"type":"module","scripts":{"test":"node --test tests/"}}`)

**Interfaces:**
- Produces: `window.REPOS = { generado: "YYYY-MM-DD", usuario: "EnderFairXD", repos: Repo[] }` con `Repo = { nombre, descripcion: string|null, url, web: string|null, lenguaje: string|null, lenguajes: string[], topics: string[], creado, actualizado }`.
- Produces: `cargar(archivos: string[]) -> object` en `tests/cargar.mjs`: ejecuta los scripts en un `vm` con `window = {}` y devuelve ese `window`.

- [ ] **Step 1:** Test `tests/repos.test.mjs`: tras `cargar(['js/repos.js'])` → `repos.length >= 10`; ningún nombre es `telegrafo-de-bolsillo` ni `nfc-toolkit`; no aparece `EnderFairXD` (repo de perfil); cada repo tiene `nombre` y `url` string y `lenguajes`/`topics` arrays; `generado` casa `/^\d{4}-\d{2}-\d{2}$/`.
- [ ] **Step 2:** `npm test` → FAIL (no existe `js/repos.js`).
- [ ] **Step 3:** `actualizar-repos.sh`: `set -euo pipefail`; `gh repo list EnderFairXD --visibility public --source --limit 100 --json ...` → `jq` al esquema `Repo`, excluyendo el repo `EnderFairXD`, ordenado por `actualizado` desc; escribe `js/repos.js` con cabecera "Generado por actualizar-repos.sh — no editar".
- [ ] **Step 4:** `./actualizar-repos.sh && npm test` → PASS.
- [ ] **Step 5:** Commit `Generador de datos de repos`.

### Task 2: Lógica pura (`js/util.js`)

**Files:** Create `js/util.js`, `tests/util.test.mjs`

**Interfaces:**
- Produces `window.UTIL` con:
  - `t(valor: string|{es,en}, idioma: 'es'|'en') -> string` — string tal cual; objeto → `valor[idioma] ?? valor.es`.
  - `idiomaInicial(guardado: string|null, navegador: string) -> 'es'|'en'`.
  - `leerPreferencia(almacen, clave) -> string|null` y `guardarPreferencia(almacen, clave, valor) -> void` — nunca lanzan.
  - `unirProyectos(curados: {repo, ...}[], repos: Repo[]) -> ({...curado, datos: Repo})[]` — omite los que no existan.
  - `resumenLenguajes(repos) -> {nombre, cantidad}[]` por `lenguaje` principal, desc, ignorando `null`.
  - `resumenTopics(repos, max=12) -> {nombre, cantidad}[]` desc, empate alfabético.

- [ ] **Step 1:** Tests: `t({es:'Hola',en:'Hi'},'en')==='Hi'`; `t({es:'Hola'},'en')==='Hola'`; `t('Python','en')==='Python'`; `idiomaInicial(null,'en-GB')==='en'`; `idiomaInicial(null,'es-ES')==='es'`; `idiomaInicial('es','en-US')==='es'`; `idiomaInicial('fr','fr-FR')==='es'`; `leerPreferencia({getItem(){throw new Error()}},'x')===null`; `guardarPreferencia({setItem(){throw new Error()}},'x','y')` no lanza; `unirProyectos([{repo:'a'},{repo:'zz'}],[{nombre:'a'}])` → longitud 1 con `datos.nombre==='a'`; `resumenLenguajes([{lenguaje:'Python'},{lenguaje:'Python'},{lenguaje:null},{lenguaje:'Dart'}])` → `[{nombre:'Python',cantidad:2},{nombre:'Dart',cantidad:1}]`; `resumenTopics` respeta `max` y orden.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `js/util.js` como IIFE que asigna `window.UTIL`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `Lógica pura: i18n, preferencias y resúmenes`.

### Task 3: Contenido (`js/datos.js`) y recursos

**Files:** Create `js/datos.js`, `assets/foto.jpg`, `assets/cv/CV_Javier_Cortes_Vidal_ES.pdf`, `assets/cv/CV_Javier_Cortes_Vidal_EN.pdf`, `tests/datos.test.mjs`

**Interfaces:**
- Consumes: `window.REPOS` (Task 1).
- Produces `window.DATOS = { persona, interfaz, sobreMi, trayectoria, areas, destacados, idiomas }`:
  - `persona: { nombre, rol:I18n, estado:I18n, ubicacion, email, linkedin, github, foto, cv:{es,en} }`
  - `interfaz`: textos de UI (`nav.*`, títulos de sección, botones) como `I18n`.
  - `sobreMi: I18n[]` (párrafos).
  - `trayectoria: { tipo:'formacion'|'experiencia', titulo:I18n, lugar, desde, hasta:string|null, detalle:I18n[] }[]`.
  - `areas: { id, titulo:I18n, resumen:I18n, tecnologias:string[], repos:string[] }[]` con los 6 ids globales.
  - `destacados: { repo, titulo:I18n, problema:I18n, solucion:I18n, decisiones:I18n[], stack:string[], areas:string[] }[]`.
  - `idiomas: { idioma:I18n, nivel:I18n }[]`.
  - `I18n = {es:string, en:string}`.

Fuentes: CVs en `~/Descargas` (formación, experiencia, idiomas) y README de cada repo (`gh api repos/EnderFairXD/<repo>/readme`). Redactar a partir de hechos reales; no inventar métricas.

- [ ] **Step 1:** Tests `tests/datos.test.mjs` (cargar `repos.js` + `datos.js`): todo objeto con clave `es` tiene `en` no vacío y viceversa (recorrido recursivo); `areas` ids == los 6 globales; `destacados.map(d=>d.repo)` == lista global en orden; todo `repo` citado en `areas`/`destacados` existe en `REPOS`; todo `areas` de destacados es un id válido; el texto de los archivos publicados no contiene números de teléfono, calles ni códigos postales; los archivos `persona.foto` y `persona.cv.es/en` existen en disco.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Copiar foto (desde la extraída del CV, a JPG ≤ 120 KB) y PDFs; leer README de los 5 destacados; escribir `js/datos.js`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `Contenido bilingüe y recursos`.

### Task 4: Página, estilos y render

**Files:** Create `index.html`, `css/estilos.css`, `js/app.js`, `.claude/launch.json` (`python3 -m http.server 8642`)

**Interfaces:**
- Consumes: `window.DATOS`, `window.REPOS`, `window.UTIL`.
- Produces: `render(idioma)` que rellena `#inicio #sobre-mi #trayectoria #conocimientos #proyectos #numeros #contacto`; botones `[data-accion="idioma"]` y `[data-accion="tema"]`; filtro de proyectos por área con `aria-pressed`; `<html lang>` y `data-theme` actualizados.

Antes de escribir: cargar la skill de diseño (`taste-skill` o `frontend-design:frontend-design`) y aplicar la dirección "ficha técnica de sistema" de la spec. Colores como tokens en `:root` con variante oscura.

- [ ] **Step 1:** `index.html` con orden de carga `repos.js → datos.js → util.js → app.js`, `<noscript>` con nombre, rol, email, GitHub, LinkedIn y enlace al CV ES; meta description y Open Graph básicos.
- [ ] **Step 2:** `css/estilos.css` + `js/app.js` con todas las secciones; revelado al scroll solo si `IntersectionObserver` existe y no hay `prefers-reduced-motion`; `@media print` muestra todo.
- [ ] **Step 3:** `npm test` → PASS (sin regresiones).
- [ ] **Step 4:** Abrir con `preview_start` → sin errores en consola; comprobar ES↔EN, claro↔oscuro, filtro, enlaces de CV según idioma.
- [ ] **Step 5:** Commit `Página completa con render bilingüe`.

### Task 5: Verificación, pulido y README

**Files:** Modify `css/estilos.css`, `js/app.js` según hallazgos; Create `README.md`

- [ ] **Step 1:** Navegador integrado a 375×812 y escritorio, ambos temas: capturas por sección; `document.documentElement.scrollWidth <= innerWidth`; corregir lo que se vea mal.
- [ ] **Step 2:** Emular `prefers-reduced-motion` (o forzar clase) y comprobar que todo el contenido es visible.
- [ ] **Step 3:** Revisión con la skill `web-design-guidelines` (foco, contraste, alt, landmarks) y corregir.
- [ ] **Step 4:** `README.md`: abrir en local, editar `js/datos.js`, regenerar repos con `./actualizar-repos.sh`, publicar en GitHub Pages.
- [ ] **Step 5:** `npm test` → PASS; commit `Pulido, accesibilidad y README`.
