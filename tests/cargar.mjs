import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const raiz = fileURLToPath(new URL('..', import.meta.url));

// Ejecuta los scripts del navegador en un contexto aislado y devuelve su `window`.
export function cargar(archivos) {
  const window = {};
  const contexto = vm.createContext({ window });
  for (const archivo of archivos) {
    vm.runInContext(readFileSync(raiz + archivo, 'utf8'), contexto, { filename: archivo });
  }
  return window;
}
