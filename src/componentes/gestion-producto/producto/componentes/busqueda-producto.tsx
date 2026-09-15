import { useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import EntidadSelectorBase from "../../../herramientas/reutilizables/entidad-selector-base";
import { SelectLinea } from "../../../../interfaces/gestion-producto/linea/interfaces-linea";
import { SelectSuperlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

export type ModoBusqueda = "denominacion" | "linea" | "superlinea";

interface BusquedaProductoProps {
  puedeBuscarPorDenominacion: boolean;
  puedeBuscarPorSeleccion: boolean;

  modoBusqueda: ModoBusqueda | null;
  onCambiarModo: (modo: ModoBusqueda) => void;

  terminoDenominacion: string;
  onCambiarTerminoDenominacion: (valor: string) => void;
  onBuscarDenominacion: () => void;

  terminoLinea: string;
  onCambiarTerminoLinea: (valor: string) => void;
  onBuscarLineas: () => void;
  opcionesLinea: SelectLinea[];
  lineaSeleccionada: SelectLinea | null;
  onSeleccionarLinea: (linea: SelectLinea | null) => void;

  terminoSuperlinea: string;
  onCambiarTerminoSuperlinea: (valor: string) => void;
  onBuscarSuperlineas: () => void;
  opcionesSuperlinea: SelectSuperlinea[];
  superlineaSeleccionada: SelectSuperlinea | null;
  onSeleccionarSuperlinea: (superlinea: SelectSuperlinea | null) => void;
}

/**
 * Presentational, fully controlled search-mode selector for ConsultarProductos.
 * It never fetches: every request is triggered by the page through the callbacks.
 * Only the modes the current role is permitted to use are rendered, driven by the
 * capability booleans the page derives from its domain predicates.
 */
export default function BusquedaProducto({
  puedeBuscarPorDenominacion,
  puedeBuscarPorSeleccion,
  modoBusqueda,
  onCambiarModo,
  terminoDenominacion,
  onCambiarTerminoDenominacion,
  onBuscarDenominacion,
  terminoLinea,
  onCambiarTerminoLinea,
  onBuscarLineas,
  opcionesLinea,
  lineaSeleccionada,
  onSeleccionarLinea,
  terminoSuperlinea,
  onCambiarTerminoSuperlinea,
  onBuscarSuperlineas,
  opcionesSuperlinea,
  superlineaSeleccionada,
  onSeleccionarSuperlinea,
}: BusquedaProductoProps) {
  const denominacionLineaRef = useRef<HTMLInputElement>(null);
  const selectLineaRef = useRef<HTMLDivElement>(null);
  const denominacionSuperlineaRef = useRef<HTMLInputElement>(null);
  const selectSuperlineaRef = useRef<HTMLDivElement>(null);

  const modos: { valor: ModoBusqueda; etiqueta: string }[] = [];
  if (puedeBuscarPorDenominacion) {
    modos.push({ valor: "denominacion", etiqueta: "Denominación" });
  }
  if (puedeBuscarPorSeleccion) {
    modos.push({ valor: "linea", etiqueta: "Línea" });
    modos.push({ valor: "superlinea", etiqueta: "SuperLínea" });
  }

  const onEnterDenominacion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onBuscarDenominacion();
    }
  };

  const onEnterLinea = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onBuscarLineas();
    }
  };

  const onEnterSuperlinea = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onBuscarSuperlineas();
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-slate-700">
      {/* Selector de modo (solo los modos permitidos) */}
      <div className="flex flex-wrap items-center gap-2 p-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Buscar por:
        </span>
        {modos.map((modo) => (
          <Button
            key={modo.valor}
            type="button"
            size="sm"
            variant={modoBusqueda === modo.valor ? "default" : "outline"}
            className={
              modoBusqueda === modo.valor
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-700 dark:text-gray-300"
            }
            onClick={() => onCambiarModo(modo.valor)}
          >
            {modo.etiqueta}
          </Button>
        ))}
      </div>

      {/* Panel del modo activo */}
      {modoBusqueda === "denominacion" && puedeBuscarPorDenominacion && (
        <div className="px-4 pb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 py-1">
            Denominación
          </label>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={terminoDenominacion}
              placeholder="Denominación..."
              className="text-black pl-10"
              onChange={(e) => onCambiarTerminoDenominacion(e.target.value)}
              onKeyDown={onEnterDenominacion}
            />
          </div>
        </div>
      )}

      {modoBusqueda === "linea" && puedeBuscarPorSeleccion && (
        <div className="px-4 pb-4">
          <EntidadSelectorBase<SelectLinea>
            titulo="Línea"
            denominacion={terminoLinea}
            setDenominacion={onCambiarTerminoLinea}
            denominacionRef={denominacionLineaRef}
            opciones={opcionesLinea}
            selected={lineaSeleccionada}
            selectedId={lineaSeleccionada?.id ?? 0}
            selectRef={selectLineaRef}
            onEnterInput={onEnterLinea}
            onChange={onSeleccionarLinea}
            onAgregar={() => {}}
            ocultarAgregar
          />
        </div>
      )}

      {modoBusqueda === "superlinea" && puedeBuscarPorSeleccion && (
        <div className="px-4 pb-4">
          <EntidadSelectorBase<SelectSuperlinea>
            titulo="SuperLínea"
            denominacion={terminoSuperlinea}
            setDenominacion={onCambiarTerminoSuperlinea}
            denominacionRef={denominacionSuperlineaRef}
            opciones={opcionesSuperlinea}
            selected={superlineaSeleccionada}
            selectedId={superlineaSeleccionada?.id ?? 0}
            selectRef={selectSuperlineaRef}
            onEnterInput={onEnterSuperlinea}
            onChange={onSeleccionarSuperlinea}
            onAgregar={() => {}}
            ocultarAgregar
          />
        </div>
      )}
    </div>
  );
}
