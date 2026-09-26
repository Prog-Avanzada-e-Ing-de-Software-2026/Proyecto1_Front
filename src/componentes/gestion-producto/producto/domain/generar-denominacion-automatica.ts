export type PartesDenominacionAutomatica = {
  marca?: string | null;
  linea?: string | null;
  presentacion?: string | null;
};

/**
 * Genera la Denominación automática: Marca + Línea + Presentación (separadas por espacio).
 * Retorna null si falta alguna parte.
 */
export function generarDenominacionAutomatica(
  partes: PartesDenominacionAutomatica,
): string | null {
  const marca = partes.marca?.trim() ?? '';
  const linea = partes.linea?.trim() ?? '';
  const presentacion = partes.presentacion?.trim() ?? '';

  if (!marca || !linea || !presentacion) {
    return null;
  }

  return `${marca} ${linea} ${presentacion}`;
}
