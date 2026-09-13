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

const contractError = (message: string) => ({
  response: { data: { message } },
});

const isListResponse = (response: unknown): response is SuperLineaListResponseDto => {
  if (!response || typeof response !== "object") return false;

  const { data, total } = response as SuperLineaListResponseDto;

  return (
    Array.isArray(data) &&
    typeof total === "number" &&
    data.every(
      (superLinea) =>
        typeof superLinea?.id === "number" &&
        typeof superLinea?.denominacion === "string",
    )
  );
};

const SuperLineaService = {
  async obtenerSelect(): Promise<SelectSuperlinea[]> {
    const response = await ApiService.get("/superlinea/select");

    if (!isListResponse(response)) {
      throw contractError("La respuesta de SuperLíneas no es válida.");
    }

    return response.data.map(({ id, denominacion }) => ({ id, denominacion }));
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
