import { createCrudService } from "../../../../utils/crudFactory";
import { Linea, SelectLinea, UpdateLineaDto } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import ApiService from "../../../../utils/apiService";
import { esSelectOptionArray, mapearSelectOptions } from "../../../../utils/selectOption";
import { FormValues } from "../interfaces/interfaces-validaciones-linea";

const baseService = createCrudService<FormValues>("linea");

const contractError = (message: string) => ({
  response: { data: { message } },
});

export interface CreateLineaDto {
  denominacion: string;
  observacion?: string | null;
  stockMinimo?: number;
  utilizaStockMinimo?: boolean;
  usuarioCreatedId: number;
  superLineaId: number;
}

const LineaService = {
  ...baseService,
  nuevo: (payload: CreateLineaDto): Promise<Linea> => ApiService.post("/linea", payload),
  actualizar: (id: number, payload: UpdateLineaDto) => ApiService.put(`/linea/${id}`, payload),

  async buscarSelect(denominacion: string): Promise<SelectLinea[]> {
    const response = await ApiService.get("/linea/select", { denominacion });

    if (!esSelectOptionArray(response)) {
      throw contractError("La respuesta de Líneas no es válida.");
    }

    return mapearSelectOptions(response);
  },
};

export default LineaService;
