import * as yup from "yup";
import { Presentacion } from "../../../../interfaces/gestion-producto/presentacion/interfaces-presentacion";

export const schema = yup.object().shape({
  denominacion: yup
    .string()
    .trim()
    .required("La denominación es obligatoria.")
    .max(255, "La denominación no puede superar los 255 caracteres.")
      .matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/]+$/, "Solo se permiten letras, números, espacios y los caracteres . - /"),

  observacion: yup.string().nullable().optional(),
});

export type FormValues = yup.InferType<typeof schema>;

export const transformData = (presentacion: Presentacion): FormValues => {
  return {
    denominacion: presentacion.denominacion,
    observacion: presentacion.observacion ?? null,
  };
};
