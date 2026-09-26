import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Select from "react-select";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input";
import { formularioPreciosSchema, type FormularioPrecios } from "../interfaces/formulario-precios";
import type { ActualizarPreciosRequest, LineaPrecios } from "../interfaces/actualizar-precios";
import { crearPayload } from "../utils/crear-payload";

interface Props {
  lineas: LineaPrecios[];
  cargandoLineas: boolean;
  errorLineas: string | null;
  pendiente: boolean;
  enviando: boolean;
  sesionVencida: boolean;
  onReintentarLineas: () => void;
  onSubmit: (payload: ActualizarPreciosRequest) => Promise<void>;
}

const selectClass = "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-slate-800 dark:text-white";

export function FormularioPrecios({ lineas, cargandoLineas, errorLineas, pendiente, enviando,
  sesionVencida, onReintentarLineas, onSubmit }: Props) {
  const { register, control, watch, handleSubmit, setError, formState: { errors } } = useForm<FormularioPrecios>({
    resolver: yupResolver(formularioPreciosSchema),
    defaultValues: { alcance: "GLOBAL", lineaId: null, tipoAjuste: 1, operacion: "AUMENTO" },
  });
  const alcance = watch("alcance");
  const tipoAjuste = watch("tipoAjuste");
  const sinLineas = alcance === "LINEA" && (cargandoLineas || !!errorLineas || lineas.length === 0);
  const submit = async (values: FormularioPrecios) => {
    if (values.alcance === "LINEA" && !lineas.some((linea) => linea.id === values.lineaId)) {
      setError("lineaId", { message: "Seleccioná una Línea disponible." });
      return;
    }
    await onSubmit(crearPayload(values));
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <fieldset disabled={pendiente || sesionVencida} className="space-y-5">
        <legend className="sr-only">Datos de la actualización</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="precios-alcance" className="block text-sm font-medium">Alcance</label>
            <select id="precios-alcance" className={selectClass} {...register("alcance")}>
              <option value="GLOBAL">Global</option>
              <option value="LINEA">Por Línea</option>
            </select>
          </div>
          {alcance === "LINEA" && (
            <div className="space-y-2">
              <label htmlFor="precios-linea" className="block text-sm font-medium">Línea</label>
              <Controller name="lineaId" control={control} render={({ field }) => (
                <Select<LineaPrecios>
                  inputId="precios-linea" instanceId="precios-linea" ref={field.ref}
                  options={lineas} value={lineas.find((linea) => linea.id === field.value) ?? null}
                  onChange={(linea) => field.onChange(linea?.id ?? null)} onBlur={field.onBlur}
                  getOptionValue={(linea) => String(linea.id)} getOptionLabel={(linea) => linea.denominacion}
                  isClearable isLoading={cargandoLineas} isDisabled={pendiente || sesionVencida || cargandoLineas || !!errorLineas}
                  placeholder="Seleccioná una Línea" noOptionsMessage={() => "No hay Líneas disponibles"}
                  loadingMessage={() => "Cargando Líneas..."} className="text-gray-900"
                  aria-invalid={!!errors.lineaId} aria-describedby="precios-linea-estado"
                />
              )} />
              <div id="precios-linea-estado" aria-live="polite" className="text-sm">
                {cargandoLineas && <p>Cargando Líneas...</p>}
                {errorLineas && <p role="alert" className="text-red-600">{errorLineas}</p>}
                {!cargandoLineas && !errorLineas && lineas.length === 0 && <p>No hay Líneas disponibles para seleccionar.</p>}
                {errors.lineaId && <p role="alert" className="text-red-600">{errors.lineaId.message}</p>}
              </div>
              {!cargandoLineas && (errorLineas || lineas.length === 0) && (
                <Button type="button" variant="outline" onClick={onReintentarLineas}>Volver a cargar Líneas</Button>
              )}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="precios-operacion" className="block text-sm font-medium">Operación</label>
            <select id="precios-operacion" className={selectClass} {...register("operacion")}>
              <option value="AUMENTO">Aumento</option>
              <option value="DISMINUCION">Disminución</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="precios-tipo" className="block text-sm font-medium">Tipo de ajuste</label>
            <select id="precios-tipo" className={selectClass} {...register("tipoAjuste", { valueAsNumber: true })}>
              <option value={1}>Porcentaje</option>
              <option value={2}>Monto fijo</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="precios-valor" className="block text-sm font-medium">{tipoAjuste === 1 ? "Porcentaje (%)" : "Monto fijo ($)"}</label>
            <Controller name="valor" control={control} render={({ field }) => (
              <Input {...field} id="precios-valor" type="number" step="any" inputMode="decimal"
                value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)}
                aria-invalid={!!errors.valor} aria-describedby="precios-valor-error" />
            )} />
            {errors.valor && <p id="precios-valor-error" role="alert" className="text-sm text-red-600">{errors.valor.message}</p>}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Se actualizarán hasta 10.000 productos por operación. El resultado mostrará los productos actualizados.</p>
        <Button type="submit" disabled={pendiente || sesionVencida || sinLineas}>
          {enviando ? "Actualizando precios..." : "Revisar actualización"}
        </Button>
      </fieldset>
    </form>
  );
}
