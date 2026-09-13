import { createCrudService } from "../../../../utils/crudFactory";
import { Linea, UpdateLineaDto } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import ApiService from "../../../../utils/apiService";
import { FormValues } from "../interfaces/interfaces-validaciones-linea";

const baseService = createCrudService<FormValues>("linea");

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
};

export default LineaService;
