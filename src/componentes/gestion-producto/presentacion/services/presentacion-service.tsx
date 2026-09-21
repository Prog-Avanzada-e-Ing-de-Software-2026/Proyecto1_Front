import { FormValues } from "../interfaces/interfaces-validaciones-presentacion";
import { createCrudService } from "../../../../utils/crudFactory";
import ApiService from "../../../../utils/apiService";

const baseService = createCrudService<FormValues>("presentacion");

const PresentacionService = {
  ...baseService,

  select: (filtros: { denominacion?: string } = {}) =>
    ApiService.get(`/presentacion/select`, filtros),
};

export default PresentacionService;
