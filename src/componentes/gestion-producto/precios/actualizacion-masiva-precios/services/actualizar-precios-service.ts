import ApiService from "../../../../../utils/apiService";
import type { ActualizarPreciosRequest, ActualizarPreciosResponse, LineaPrecios } from "../interfaces/actualizar-precios";

export const ActualizarPreciosService = {
  // ApiService/Axios resuelve tanto 200 como 201 y agrega el Bearer token.
  actualizar: (payload: ActualizarPreciosRequest): Promise<ActualizarPreciosResponse> =>
    ApiService.post("/producto/actualizar-precios", payload),

  async obtenerLineas(): Promise<LineaPrecios[]> {
    // El backend exige el query `denominacion` (400 si se omite); vacío = catálogo completo.
    const response: { data: LineaPrecios[] } = await ApiService.get(
      "/producto/find-all-for-lineas/select",
      { denominacion: "" },
    );
    return response.data.map(({ id, denominacion }) => ({ id, denominacion }));
  },
};
