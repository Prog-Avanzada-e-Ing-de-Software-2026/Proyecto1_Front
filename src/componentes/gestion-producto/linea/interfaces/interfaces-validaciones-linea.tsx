import * as yup from "yup";
import { Linea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import { finiteNumber } from "../../../../utils/yup";

//===================== interfaces ============================================//

export interface FormValues {
  denominacion: string;
  observacion?: string | null;
  stockMinimo?: number;
  utilizaStockMinimo?: boolean;
  superLineaId?: number;
}

export interface SublineasEnPayload {
  denominacion: string;
  observacion?: string | null;
  usuarioCreatedId: number;
}

//===================== schema de validacion ============================================//

export const schema = (utilizaStockMinimo: boolean, isCreate: boolean) =>
  yup.object().shape({
    denominacion: yup
      .string()
      .trim()
      .required("La denominación es obligatoria.")
      .max(255, "Máximo 255 caracteres.")
      .matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/, "Solo se permiten letras, números y espacios."),
    observacion: yup.string().optional().nullable(),
    stockMinimo: yup.number().when([], {
      is: () => utilizaStockMinimo,
      then: (schema) =>
        schema
          .required("El Stock minimo es obligatorio.")
          .test("finite", "El stock mínimo debe ser un número finito.", (value) => value == null || Number.isFinite(value))
          .min(0, "El stock minimo debe ser mayor o igual a 0."),
      otherwise: (schema) =>
        schema
          .test("finite", "El stock mínimo debe ser un número finito.", (value) => value == null || Number.isFinite(value))
          .min(0, "El stock minimo debe ser mayor o igual a 0.")
          .optional(),
    }),
    utilizaStockMinimo: yup.boolean().optional(),
    superLineaId: finiteNumber("La SuperLínea debe ser un número finito.").when([], {
      is: () => isCreate,
      then: (schema) =>
        schema
          .transform((value, originalValue) => (originalValue === "" ? null : value))
          .typeError("La SuperLínea es obligatoria.")
          .required("La SuperLínea es obligatoria.")
          .integer("La SuperLínea debe ser un número entero.")
          .moreThan(0, "La SuperLínea es obligatoria."),
      otherwise: (schema) =>
        schema
          .integer("La SuperLínea debe ser un número entero.")
          .moreThan(0, "La SuperLínea es obligatoria.")
          .optional(),
    }),
   
  });

//===================== transform data ============================================//

export const transformData = (linea: Linea): FormValues => {
  return {
    denominacion: linea.denominacion,
    observacion: linea.observacion ?? null,
    stockMinimo: linea.stockMinimo ?? 0,
    utilizaStockMinimo: linea.utilizaStockMinimo ?? false,
    superLineaId: linea.superLinea?.id ?? linea.superlinea?.id,
  };
};
