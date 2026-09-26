export interface ActualizarPreciosRequest {
  lineaId?: number;
  tipoAjuste: 1 | 2;
  operacion: "AUMENTO" | "DISMINUCION";
  valor: number;
}

export interface ProductoActualizado {
  denominacion: string;
  costo: number;
  precio: number;
}

export interface ActualizarPreciosResponse {
  message: string;
  productos: ProductoActualizado[];
}

export interface LineaPrecios {
  id: number;
  denominacion: string;
}
