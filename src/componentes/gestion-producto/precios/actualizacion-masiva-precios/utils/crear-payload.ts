import { formularioPreciosSchema, type FormularioPrecios } from "../interfaces/formulario-precios";
import type { ActualizarPreciosRequest } from "../interfaces/actualizar-precios";

export function crearPayload(values: FormularioPrecios): ActualizarPreciosRequest {
  const validos = formularioPreciosSchema.validateSync(values, { stripUnknown: true });
  return {
    ...(validos.alcance === "LINEA" ? { lineaId: validos.lineaId } : {}),
    tipoAjuste: validos.tipoAjuste as 1 | 2,
    operacion: validos.operacion,
    valor: validos.valor,
  };
}

export function resumenAjuste(payload: ActualizarPreciosRequest, linea?: string): string {
  // Preservar la precisión del valor confirmado; el formato monetario de resultados es independiente.
  const valor = String(payload.valor).replace(".", ",");
  const ajuste = payload.tipoAjuste === 1 ? `${valor} %` : `$ ${valor}`;
  const alcance = payload.lineaId ? `la Línea «${linea}»` : "alcance global";
  const operacion = payload.operacion === "AUMENTO" ? "Aumento" : "Disminución";
  return `${operacion} de ${ajuste} para ${alcance}.\nLa operación actualizará hasta 10.000 productos. ¿Deseás continuar?`;
}
