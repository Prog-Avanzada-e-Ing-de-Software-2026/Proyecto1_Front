import * as yup from "yup";

export const formularioPreciosSchema = yup.object({
  alcance: yup.mixed<"GLOBAL" | "LINEA">().oneOf(["GLOBAL", "LINEA"]).required(),
  lineaId: yup.number().nullable().when("alcance", {
    is: "LINEA",
    then: (schema) => schema
      .typeError("Seleccioná una Línea válida.")
      .integer("Seleccioná una Línea válida.")
      .positive("Seleccioná una Línea válida.")
      .required("Seleccioná una Línea."),
    otherwise: (schema) => schema.strip(),
  }),
  operacion: yup.mixed<"AUMENTO" | "DISMINUCION">()
    .oneOf(["AUMENTO", "DISMINUCION"], "Seleccioná una operación válida.").required(),
  tipoAjuste: yup.number().oneOf([1, 2], "Seleccioná un tipo de ajuste válido.").required(),
  valor: yup.number()
    .transform((value, original) => original === "" ? undefined : value)
    .typeError("Ingresá un valor numérico válido.")
    .required("Ingresá el valor del ajuste.")
    .positive("El valor del ajuste debe ser mayor que 0.")
    .test("finito", "Ingresá un valor numérico finito.", (value) => Number.isFinite(value)),
});

export type FormularioPrecios = yup.InferType<typeof formularioPreciosSchema>;
