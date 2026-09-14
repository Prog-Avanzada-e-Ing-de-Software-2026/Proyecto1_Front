import {
  Info,
  Pencil,
  Trash,
  History,
} from "lucide-react";
import type { ConsultarProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";


interface Props {
  producto: ConsultarProducto;

  onEditar: (id: number) => void;
  onInfo: (id: number) => void;
  onDelete: (id: number) => void;
  onHistorial?: (id: number, denominacion: string) => void;

  puedeAccionar?: boolean;
  puedeVerHistorialPrecios?: boolean;

  compact?: boolean;
}

export function ProductoActions({
  producto,
  onEditar,
  onInfo,
  onDelete,
  onHistorial,

  puedeAccionar = true,
  puedeVerHistorialPrecios = false,

  compact = false,
}: Props) {
  return (
    <div className={`flex items-center gap-1 ${compact ? "justify-end" : ""}`}>
      {puedeVerHistorialPrecios && onHistorial && (
        <ActionButton
          variant="history"
          title="Historial de precios"
          onClick={() => onHistorial(producto.id, producto.denominacion)}
        >
          <History size={16} />
        </ActionButton>
      )}

      {puedeAccionar && (
        <>
          <ActionButton
            variant="info"
            title="Ver información"
            onClick={() => onInfo(producto.id)}
          >
            <Info size={16} />
          </ActionButton>

          <ActionButton
            variant="edit"
            title="Editar producto"
            onClick={() => onEditar(producto.id)}
          >
            <Pencil size={16} />
          </ActionButton>

          <ActionButton
            variant="delete"
            title="Eliminar producto"
            onClick={() => onDelete(producto.id)}
          >
            <Trash size={16} />
          </ActionButton>
        </>
      )}
    </div>
  );
}
