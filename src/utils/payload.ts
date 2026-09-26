/**
 * Devuelve una copia del payload omitiendo las claves opcionales cuyo valor sea
 * `null`, `undefined`, cadena vacía o compuesta únicamente por espacios.
 * Los valores no vacíos se recortan conservando su contenido.
 */
export function omitEmptyOptionalStrings<T extends Record<string, unknown>>(
  payload: T,
  keys: readonly (keyof T & string)[],
): T {
  const copy = { ...payload } as Record<string, unknown>;

  for (const key of keys) {
    const value = copy[key];

    if (value === null || value === undefined) {
      delete copy[key];
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        delete copy[key];
      } else {
        copy[key] = trimmed;
      }
    }
  }

  return copy as T;
}
