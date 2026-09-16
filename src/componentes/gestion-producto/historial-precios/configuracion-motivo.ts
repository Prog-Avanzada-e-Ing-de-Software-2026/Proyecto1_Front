import { MotivoCambioPrecio } from "../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";

interface ConfiguracionMotivo {
  etiqueta: string;
  className: string;
}

export const configuracionMotivo: Record<MotivoCambioPrecio, ConfiguracionMotivo> = {
  [MotivoCambioPrecio.ActualizacionDeCosto]: {
    etiqueta: "Actualización de costo",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  [MotivoCambioPrecio.ActualizacionDeMargen]: {
    etiqueta: "Actualización de margen",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  [MotivoCambioPrecio.ActualizacionDePrecioPorLinea]: {
    etiqueta: "Actualización de precio por línea",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  [MotivoCambioPrecio.ActualizacionDePrecioGlobal]: {
    etiqueta: "Actualización de precio global",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [MotivoCambioPrecio.ActualizacionDePrecioDirecta]: {
    etiqueta: "Actualización de precio directa",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function obtenerConfiguracionMotivo(motivo: MotivoCambioPrecio): ConfiguracionMotivo {
  return configuracionMotivo[motivo];
}