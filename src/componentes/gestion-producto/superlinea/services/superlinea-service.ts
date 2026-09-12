import {
  CreateSuperLineaDto,
  SelectSuperlinea,
  SuperLineaListResponseDto,
} from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
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
    ApiService.post("/superlinea", payload),
};

export default SuperLineaService;
