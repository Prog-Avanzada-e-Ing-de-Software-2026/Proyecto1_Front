import { useEffect } from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import { useFiltrosContext } from "../../../../context/filtros-contesxt";
import { FormularioPrecios } from "./componentes/formulario-precios";
import { ResultadoPrecios } from "./componentes/resultado-precios";
import { useActualizarPrecios } from "./hooks/use-actualizar-precios";

export default function ActualizacionMasivaPrecios() {
  const { setFiltrosNecesarios } = useFiltrosContext();
  const { lineas, cargandoLineas, errorLineas, cargarLineas, pendiente, enviando,
    error, resultado, actualizar, AlertasConfirmacion, sesionVencida, iniciarSesion } = useActualizarPrecios();

  useEffect(() => {
    setFiltrosNecesarios({});
  }, [setFiltrosNecesarios]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Card>
        <CardHeader>
          <h1 className="flex items-center gap-2 text-xl font-semibold"><DollarSign aria-hidden="true" />Actualización masiva de precios</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Aumentá o disminuí los precios de forma global o por Línea.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormularioPrecios lineas={lineas} cargandoLineas={cargandoLineas} errorLineas={errorLineas}
            pendiente={pendiente} enviando={enviando} sesionVencida={sesionVencida}
            onReintentarLineas={cargarLineas} onSubmit={actualizar} />
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-100">{error}</p>}
          {sesionVencida && (
            <div role="alert" className="space-y-2">
              <p>Tu sesión no está disponible. Iniciá sesión nuevamente para continuar.</p>
              <Button type="button" onClick={iniciarSesion}>Iniciar sesión</Button>
            </div>
          )}
          {enviando && <p role="status">Actualizando precios. Esperá el resultado antes de iniciar otra operación.</p>}
        </CardContent>
      </Card>
      {resultado && <ResultadoPrecios resultado={resultado} />}
      <AlertasConfirmacion />
    </div>
  );
}
