import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Card } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import ProductoService from "../producto/services/producto-service";
import { PAGINACION } from "../../../config/paginacion";
import { usePaginacion } from "../../../hooks/use-paginacion";
import Paginacion from "../../herramientas/reutilizables/paginacion";
import { TablaAGGrid, Column } from "../../herramientas/tablas/tabla-flexible-ag-grid";
import { formatFechaHora, formatPrice } from "../../herramientas/formateo-de-campos/fucion-formateo";
import { obtenerConfiguracionMotivo } from "./configuracion-motivo";
import { CambioPrecioDto } from "../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";

interface Props {
  productoId: number;
  denominacion?: string;
  onClose: () => void;
}

export function HistorialPreciosModal({ productoId, denominacion, onClose }: Props) {
  const [cambios, setCambios] = useState<CambioPrecioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    paginaActual,
    entidadesTotales,
    skip,
    take,
    setEntidadesTotales,
    handlePageChange,
  } = usePaginacion(PAGINACION.TAKE_DEFAULT);

  useEffect(() => {
    let activo = true;

    const cargarCambios = async () => {
      setLoading(true);
      setError(null);
      try {
        const respuesta = await ProductoService.obtenerHistorialPrecios(productoId, skip, take + 1);
        if (!activo) return;
        const hayMas = respuesta.length > take;
        const visibles = hayMas ? respuesta.slice(0, take) : respuesta;
        setCambios(visibles);
        setEntidadesTotales(skip + visibles.length + (hayMas ? take : 0));
      } catch {
        if (!activo) return;
        setCambios([]);
        setError("No se pudo obtener el historial de precios.");
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargarCambios();

    return () => {
      activo = false;
    };
  }, [productoId, skip, take, setEntidadesTotales]);

  const columns: Column<CambioPrecioDto>[] = [
    {
      header: "Fecha",
      accessor: "fecha",
      flex: 0.8,
      type: "text",
      editable: false,
      formatFunction: ({ value }) => <span>{formatFechaHora(value)}</span>,
    },
    {
      header: "Precio anterior",
      accessor: "precioAnterior",
      flex: 0.5,
      type: "text",
      align: "right",
      editable: false,
      formatFunction: ({ value }) => <span>${formatPrice(value)}</span>,
    },
    {
      header: "Precio nuevo",
      accessor: "precioNuevo",
      flex: 0.5,
      type: "text",
      align: "right",
      editable: false,
      formatFunction: ({ value }) => <span>${formatPrice(value)}</span>,
    },
    {
      header: "Motivo",
      accessor: "motivo",
      flex: 1,
      type: "text",
      editable: false,
      formatFunction: ({ value }) => {
        const config = obtenerConfiguracionMotivo(value);
        return <Badge variant="outline" className={`${config.className} px-2 py-1`}>{config.etiqueta}</Badge>;
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <Card className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 text-2xl leading-none"
            title="Cerrar"
            aria-label="Cerrar historial de precios"
          >
            &times;
          </button>

          <div className="flex items-center gap-3 pr-12">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Historial de Precios</h2>
              <p className="text-slate-300 text-sm mt-1">
                Cambios de precio de {denominacion || `Producto ${productoId}`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando historial de precios...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</p>
            </div>
          ) : cambios.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              <History size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-slate-600 dark:text-slate-400 text-sm">El producto no tiene cambios de precio.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <TablaAGGrid
                  columns={columns}
                  data={cambios}
                  actionsFlex={0.5}
                  rowHeight={55}
                />
              </div>

              <div className="mt-6">
                <Paginacion
                  entidadesTotales={entidadesTotales}
                  take={take}
                  paginaActual={paginaActual}
                  onChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}