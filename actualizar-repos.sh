#!/usr/bin/env bash
# Regenera js/repos.js con los repositorios públicos de GitHub y js/precios.js con una copia
# del histórico del rastreador de precios. Requiere `gh` (con sesión iniciada), `curl` y `jq`.
#
# Variables opcionales:
#   SALIDA          carpeta de destino (por defecto, js/ junto a este script)
#   FUENTE_PRECIOS  URL del histórico (admite file:// para pruebas)
#   SOLO            "repos" o "precios" para generar solo uno de los dos
set -euo pipefail

USUARIO="EnderFairXD"
SALIDA="${SALIDA:-$(dirname "$0")/js}"
FUENTE_PRECIOS="${FUENTE_PRECIOS:-https://enderfairxd.github.io/rastreador-de-precios/historico.json}"
SOLO="${SOLO:-}"
HOY="$(date +%F)"

# Escribe "window.<variable> = <json>;" de forma atómica: o el archivo completo, o nada.
escribir() {
  local destino="$1" variable="$2" json="$3" temporal
  temporal="$(mktemp "$destino.XXXXXX")"
  {
    echo "// Generado por actualizar-repos.sh — no editar a mano."
    echo "window.$variable = $json;"
  } > "$temporal"
  mv "$temporal" "$destino"
}

if [[ "$SOLO" != "precios" ]]; then
  lista=$(gh repo list "$USUARIO" --visibility public --source --limit 100 \
    --json name,description,url,homepageUrl,primaryLanguage,languages,repositoryTopics,createdAt,updatedAt)
  repos=$(jq --arg usuario "$USUARIO" --arg hoy "$HOY" '{
      generado: $hoy,
      usuario: $usuario,
      repos: [ .[]
        | select(.name != $usuario and .name != ($usuario + ".github.io"))
        | {
            nombre: .name,
            descripcion: (if (.description // "") == "" then null else .description end),
            url: .url,
            web: (if (.homepageUrl // "") == "" then null else .homepageUrl end),
            lenguaje: (.primaryLanguage.name // null),
            lenguajes: [ .languages[]?.node.name ],
            topics: [ .repositoryTopics[]?.name ],
            creado: .createdAt[0:10],
            actualizado: .updatedAt[0:10]
          }
      ] | sort_by(.actualizado) | reverse
    }' <<<"$lista")
  escribir "$SALIDA/repos.js" REPOS "$repos"
  echo "$(jq '.repos | length' <<<"$repos") repos escritos en $SALIDA/repos.js"
fi

if [[ "$SOLO" != "repos" ]]; then
  # Copia de respaldo por si la web no puede leer el histórico en directo.
  historico=$(curl -sfL "$FUENTE_PRECIOS")
  precios=$(jq --arg hoy "$HOY" --arg fuente "$FUENTE_PRECIOS" '
    if (.gesture | type) == "array" and (.tygr | type) == "array" then . else error("histórico con formato inesperado") end
    | {generado: $hoy, fuente: $fuente, historico: {gesture, tygr} | map_values(map({fecha, mejor, tienda}))}
  ' <<<"$historico")
  escribir "$SALIDA/precios.js" PRECIOS "$precios"
  echo "Histórico de precios escrito en $SALIDA/precios.js"
fi
