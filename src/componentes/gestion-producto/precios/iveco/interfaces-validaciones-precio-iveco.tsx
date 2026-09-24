import * as yup from "yup";

export interface FormValues {
  cotizacionDolar: number;
}

//===================== schema de validacion ============================================//

export const crearSchemaValidacion = (maximoDolar: number | undefined) => {
  let cotizacionDolar = yup
    .number()
    .typeError("La cotización es obligatoria.")
    .required("La cotización es obligatoria.")
    .moreThan(999, "La cotización debe ser mayor que 1000.")
    .notOneOf([Infinity, -Infinity], "Valor inválido.");

  if (typeof maximoDolar === "number" && Number.isFinite(maximoDolar)) {
    cotizacionDolar = cotizacionDolar.max(
      maximoDolar,
      `La cotización no puede ser mayor a ${maximoDolar}.`,
    );
  }

  return yup.object().shape({ cotizacionDolar });
};
