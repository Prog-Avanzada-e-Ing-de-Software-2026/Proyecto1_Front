import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { jwtDecode } from "jwt-decode";
import MarcaService from "../services/marca-service";
import {
  FormValues,
  schema,
  transformData,
} from "../interfaces/interfaces-validaciones-marca";
import { Marca } from "../../../../interfaces/gestion-producto/marca/interfaces-marca";
import { applyApiErrors, ApiFieldMap } from "../../../../utils/errores";
import { omitEmptyOptionalStrings } from "../../../../utils/payload";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { getUsuarioId } from "../../../../utils/auth";

const marcaFieldMap: ApiFieldMap<FormValues> = {
  denominacion: "denominacion",
  observacion: "observacion",
};

export function useMarcaForm(
  marca: Marca | undefined,
  onClose: () => void,
  onSuccess: (mensajeAlerta: string) => void
) {
  // ===================== TOKEN =====================
  const usuarioId = getUsuarioId();


  // ===================== FORM =====================
  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: marca ? transformData(marca) : {},
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  // ===================== SUBMIT =====================
  const onSubmit = async (formData: FormValues) => {
    let response: ResponsePost;

    try {
      if (marca) {
        const payload = omitEmptyOptionalStrings(
          {
            denominacion: formData.denominacion,
            observacion: formData.observacion,
            usuarioUpdatedId: usuarioId,
          },
          ["observacion"],
        );

        console.log("Payload enviado:", JSON.stringify(payload, null, 2));

        response = await MarcaService.actualizar(marca.id, payload);
      } else {
        const payload = omitEmptyOptionalStrings(
          {
            ...formData,
            usuarioCreatedId: usuarioId,
          },
          ["observacion"],
        );

        console.log("Payload enviado:", JSON.stringify(payload, null, 2));

        response = await MarcaService.nuevo(payload);
      }

      onClose();
      onSuccess(response.mensaje);
    } catch (error) {
      applyApiErrors(error, setError, marcaFieldMap);
    }
  };

  return {
    methods,
    handleSubmit,
    onSubmit,
    isSubmitting,
    errors,
  };
}