#!/usr/bin/env bash
# Pone en index.html la huella del contenido de cada CSS/JS (?v=...), para que el navegador
# descargue la versión nueva en cuanto cambia un archivo. Ejecútalo antes de cada commit.
set -euo pipefail
cd "$(dirname "$0")"
python3 - <<'PY'
import hashlib, pathlib, re
html = pathlib.Path('index.html')
texto = html.read_text(encoding='utf-8')
def con_huella(m):
    atributo, archivo = m.group(1), m.group(2)
    huella = hashlib.sha256(pathlib.Path(archivo).read_bytes()).hexdigest()[:10]
    return f'{atributo}="{archivo}?v={huella}"'
nuevo = re.sub(r'(href|src)="((?:css|js)/[^"?]+)(?:\?v=[0-9a-f]+)?"', con_huella, texto)
html.write_text(nuevo, encoding='utf-8')
print('Huellas actualizadas en index.html' if nuevo != texto else 'Huellas ya al día')
PY
