# Web portfolio / CV extendido — Especificación

Fecha: 2026-10-15 · Autor: Javier Cortés Vidal

## Objetivo

Página personal que funcione a la vez como portfolio completo y como enlace en candidaturas.
Perfil **híbrido equilibrado**: sistemas + desarrollo. Un reclutador debe entender en menos de un
minuto quién es Javier y qué ha construido; un técnico debe poder profundizar en proyectos y conocimientos.

## Restricciones

- Estática, sin backend ni paso de compilación: HTML + CSS + JS vanilla. Se abre con doble clic.
- Uso local de momento; debe poder subirse a GitHub Pages sin cambios.
- Bilingüe **ES / EN** con selector; ES por defecto (o según `navigator.language`), elección recordada en `localStorage`.
- Privacidad: solo repos **públicos**. Sin teléfono ni dirección postal. Contacto: email, LinkedIn, GitHub.
- Sin dependencias externas obligatorias salvo Google Fonts (con fuentes de sistema como respaldo).
- Accesible (contraste AA, foco visible, `prefers-reduced-motion`), responsive desde 360 px.

## Fuentes de datos

- CV ES/EN en `~/Descargas` (formación, experiencia, idiomas, foto).
- GitHub (`gh`): perfil, repos públicos, lenguajes, topics, README.
- LinkedIn no accesible sin sesión: no se usa.

## Estructura de archivos

```
index.html            marcado de secciones vacías + plantillas
css/estilos.css       tokens, tema claro/oscuro, layout
js/datos.js           TODO el contenido (ES/EN), editable a mano
js/repos.js           datos de repos generados por el script (no editar a mano)
js/app.js             render, i18n, tema, filtros, animaciones
assets/foto.jpg       foto extraída del CV
assets/cv/            CV_ES.pdf, CV_EN.pdf
actualizar-repos.sh   regenera js/repos.js con `gh`
README.md             cómo abrir, editar y actualizar
```

Separación: `datos.js` = textos curados; `repos.js` = datos automáticos (lenguajes, topics,
fechas, URL, homepage). Los proyectos destacados combinan ambos por nombre de repo.

## Secciones

1. **Portada**: foto, nombre, rol, línea de estado (formación actual · Sevilla · disponibilidad),
   botones: Proyectos, CV PDF (según idioma), GitHub, LinkedIn, email. Selector de idioma y tema en la barra.
2. **Sobre mí**: relato Bachillerato → DAM → ASIR → Ciberseguridad y valor del perfil híbrido.
3. **Trayectoria**: línea de tiempo con formación y prácticas (Stratos Global Solutions, Pinturas Eurotex).
4. **Conocimientos a fondo**: 6 áreas (Backend Python · Móvil y escritorio · IA local · Datos y GIS ·
   Sistemas y redes · Ciberseguridad). Cada una: párrafo, tecnologías, repos que lo demuestran (enlaces internos).
   Sin barras de porcentaje.
5. **Proyectos**: 5 destacados (GEOgis-SimpleWeb, portapapeles-universal-p2p, STUDYBRAIN-AI,
   rastreador-de-precios, boveda-garantias) con problema / solución / stack / decisiones técnicas / enlaces.
   Resto en rejilla filtrable por área.
6. **En números**: nº de repos públicos, distribución de lenguajes principales, topics más usados.
7. **Idiomas + contacto + pie** (fecha de última actualización de datos).

## Dirección visual

"Ficha técnica de sistema": tipografía editorial + monoespaciada para metadatos, rejilla limpia,
un color de acento, claro/oscuro, animaciones sutiles al hacer scroll. Evitar estética "hacker"
cliché y plantillas genéricas.

## Verificación

- Abrir en navegador: sin errores de consola, ambos idiomas, ambos temas, 375 px y escritorio.
- `actualizar-repos.sh` regenera `repos.js` y la página sigue funcionando.
- Revisión contra guías de interfaz (accesibilidad, foco, contraste).
