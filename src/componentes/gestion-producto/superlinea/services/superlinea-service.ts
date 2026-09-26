import {
  CreateSuperLineaDto,
  SearchSuperLineaParams,
  SelectSuperlinea,
  SuperLineaDto,
  SuperLineaListResponseDto,
  UpdateSuperLineaDto,
} from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { Auditoria, ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import ApiService from "../../../../utils/apiService";
import { esSelectOptionArray, mapearSelectOptions } from "../../../../utils/selectOption";

const contractError = (message: string) => ({
  response: { data: { message } },
});

const isSelectResponse = (response: unknown): response is SelectSuperlinea[] =>
  Array.isArray(response) &&
  response.every(
    (superLinea) =>
      typeof superLinea?.id === "number" &&
      typeof superLinea?.denominacion === "string",
  );

const SuperLineaService = {
  async obtenerSelectParaLinea(): Promise<SelectSuperlinea[]> {
    const response = await ApiService.get("/linea/find-all-for-superlinea/select");

    if (!isSelectResponse(response)) {
      throw contractError("La respuesta de SuperLíneas no es válida.");
    }

    return response.map(({ id, denominacion }) => ({ id, denominacion }));
  },

  async obtenerSelectParaProductos(denominacion: string): Promise<SelectSuperlinea[]> {
    const response = await ApiService.get("/superlinea/select", { denominacion });

    if (!esSelectOptionArray(response)) {
      throw contractError("La respuesta de SuperLíneas no es válida.");
    }

    return mapearSelectOptions(response);
  },

  nuevo: (payload: CreateSuperLineaDto) =>
    ApiService.post("/superlinea", payload) as Promise<ResponsePost>,

  obtener: (params: SearchSuperLineaParams) =>
    ApiService.get("/superlinea/search-by", params) as Promise<SuperLineaListResponseDto>,

  obtenerId: (id: number) => ApiService.get(`/superlinea/${id}`) as Promise<SuperLineaDto>,

  actualizar: (id: number, payload: UpdateSuperLineaDto) =>
    ApiService.put(`/superlinea/${id}`, payload) as Promise<ResponsePost>,

  eliminar: (id: number, usuarioId: number) =>
    ApiService.delete(`/superlinea/${id}`, usuarioId) as Promise<ResponsePost>,

  obtenerAuditoria: (id: number) =>
    ApiService.get(`/superlinea/${id}/audit`) as Promise<Auditoria>,
};

export default SuperLineaService;
