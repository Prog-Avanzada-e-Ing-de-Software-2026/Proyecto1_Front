import { useCallback, useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CardContent, CardFooter } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import FormInput from "../../../herramientas/formateo-de-campos/form-input";
import React from "react";
import { Card } from "../../../ui/Card";
import { FormValues, schema, transformData } from "../interfaces/interfaces-validaciones-linea";
import LineaService from "../services/linea-service";
import { Linea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";

import { Layers } from "lucide-react";
import { applyApiErrors, ApiFieldMap, parseApiError } from "../../../../utils/errores";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import CantidadesInput from "../../../herramientas/formateo-de-campos/cantidades-input";
import { getUsuarioId } from "../../../../utils/auth";
import EncabezadoFormularios from "../../../ui/encabezadoFormularios";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import { SelectSuperlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import SuperLineaService from "../../superlinea/services/superlinea-service";
import RegistrarSuperlinea from "../../superlinea/utils/registrar-superlinea";
import SuperlineasSelector from "../componentes/superlineas-selector";

const lineaFieldMap: ApiFieldMap<FormValues> = {
  denominacion: "denominacion",
  observacion: "observacion",
  stockMinimo: "stockMinimo",
  utilizaStockMinimo: "utilizaStockMinimo",
  superLineaId: "superLineaId",
};

export default function RegistrarActualizarLineaForm({
  linea,
  onClose,
  onSuccess,
}: {
  linea?: Linea;
  onClose: () => void;
  onSuccess: (mensajeAlerta: string) => void;
}) {
  const usuarioId = getUsuarioId();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();
  const [rStockCritico, setStockCritico] = useState(false);
  const [superlineas, setSuperlineas] = useState<SelectSuperlinea[]>([]);
  const [superlineasLoading, setSuperlineasLoading] = useState(true);
  const [superlineasError, setSuperlineasError] = useState<string>();
  const [mostrarFormularioSuperlinea, setMostrarFormularioSuperlinea] = useState(false);
  const [superlineaSuccess, setSuperlineaSuccess] = useState<string>();

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema(rStockCritico, !linea)) as any,
    defaultValues: linea ? transformData(linea) : {},
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = methods;

 
  const stockMinimo = watch("stockMinimo");
  const utilizaStockMinimo = watch("utilizaStockMinimo");

  useEffect(() => {
    if (!utilizaStockMinimo) {
      setValue("stockMinimo", 0);
    }
  }, [utilizaStockMinimo, setValue]);

  useEffect(() => {
    setStockCritico(utilizaStockMinimo || false);
  }, [utilizaStockMinimo]);

  const cargarSuperlineas = useCallback(async () => {
    setSuperlineasLoading(true);
    setSuperlineasError(undefined);

    try {
      const opciones = await SuperLineaService.obtenerSelectParaLinea();
      setSuperlineas(opciones);
      clearErrors("root");
    } catch (error) {
      const message = parseApiError(error);
      setSuperlineas([]);
      setSuperlineasError(message);
      setError("root", { type: "manual", message });
    } finally {
      setSuperlineasLoading(false);
    }
  }, [clearErrors, setError]);

  useEffect(() => {
    cargarSuperlineas();
  }, [cargarSuperlineas, linea]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (linea) {
          setValue("denominacion", linea.denominacion || "");
          setValue("observacion", linea.observacion || null);
          setValue("stockMinimo", linea.stockMinimo || 0);
          setValue("utilizaStockMinimo", linea.utilizaStockMinimo || false);
          
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (formData: FormValues) => {
    try {
      const { superLineaId, observacion, ...lineaValues } = formData;
      const observacionNormalizada = observacion?.trim();
      const observacionPayload = observacionNormalizada ? { observacion: observacionNormalizada } : {};

      if (linea) {
        const superLineaInicialId = linea.superLinea?.id ?? linea.superlinea?.id;
        const payload = {
          ...lineaValues,
          ...observacionPayload,
          usuarioUpdatedId: usuarioId,
          ...(superLineaId !== superLineaInicialId ? { superLineaId } : {}),
        };
        const response: ResponsePost = await LineaService.actualizar(linea.id, payload);
        onClose();
        onSuccess(response.mensaje);
      } else {
        const response = await LineaService.nuevo({
          ...lineaValues,
          ...observacionPayload,
          usuarioCreatedId: usuarioId,
          superLineaId: Number(superLineaId),
        });
        onClose();
        onSuccess("mensaje" in response && typeof response.mensaje === "string" ? response.mensaje : "Línea registrada correctamente.");
      }
    } catch (error) {
      applyApiErrors(error, setError, lineaFieldMap);
    }
  };

  const handleSuperlineaSuccess = async () => {
    await cargarSuperlineas();
    setSuperlineaSuccess("SuperLínea registrada correctamente.");
  };

 

  

  
  const handleOnClose = async () => {
    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DEFAULT,
      title: TituloAlertaConfirmacion.DEFAULT,
      message: "¿Estás seguro de que quieres cerrar el formulario? NO se guardaran los cambios.",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });
    if (confirmed) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto py-5">
      <Card className="relative w-full max-w-7xl bg-white mx-auto shadow-lg rounded-lg overflow-hidden mt-10 mb-12">
        <EncabezadoFormularios
          title={linea ? "Actualizar Línea" : "Registrar Línea"}
          subtitle={linea ? "Modifica los detalles de la línea." : "Ingresa los datos de la nueva línea."}
          icon={<Layers className="form-icon" />}
          onClose={handleOnClose}
        />

        <fieldset disabled={linea?.sistema === 1}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-6 py-4">
                <div className="lg:col-span-2">
                  <FormInput name="denominacion" label="Denominación" placeholder="Ingresa la denominación" />
                </div>

                <div className="lg:col-span-2">
                  <FormInput name="observacion" label="Observación" placeholder="Ingresa una observación (opcional)" />
                </div>

                <SuperlineasSelector
                  superlineas={superlineas}
                  superLineaId={watch("superLineaId")}
                  disabled={isSubmitting}
                  loading={superlineasLoading}
                  error={errors.superLineaId?.message ?? superlineasError}
                  onChange={(superLinea) =>
                    setValue("superLineaId", superLinea?.id, { shouldValidate: true })
                  }
                  onAgregar={() => setMostrarFormularioSuperlinea(true)}
                />

                <div className="flex items-end gap-2 lg:col-span-1">
                  <label className="flex items-center pb-2">
                    <input
                      type="checkbox"
                      {...methods.register("utilizaStockMinimo")}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <CantidadesInput
                    name="stockMinimo"
                    label="Stock Crítico"
                    value={stockMinimo || 0}
                    onChange={(value) => setValue("stockMinimo", Number(value))}
                    disabled={utilizaStockMinimo ? false : true}
                  />
                </div>
              </CardContent>
              {errors.root?.message && (
                <div
                  className="text-red-600 text-center mb-4"
                  role="alert"
                  aria-live="assertive"
                >
                  {String(errors.root.message)}
                </div>
              )}
              {superlineaSuccess && (
                <div className="text-green-600 text-center mb-4">{superlineaSuccess}</div>
              )}

              <CardFooter className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting || superlineasLoading || superlineas.length === 0 || Boolean(superlineasError)}
                  className="btn btn-dark"
                >
                  {isSubmitting ? (linea ? "Actualizando..." : "Registrando...") : linea ? "Actualizar" : "Registrar"}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </fieldset>
      </Card>

      {mostrarFormularioSuperlinea && (
        <RegistrarSuperlinea
          onClose={() => setMostrarFormularioSuperlinea(false)}
          onSuccess={handleSuperlineaSuccess}
        />
      )}

      <AlertasConfirmacion />
    </div>
  );
}
