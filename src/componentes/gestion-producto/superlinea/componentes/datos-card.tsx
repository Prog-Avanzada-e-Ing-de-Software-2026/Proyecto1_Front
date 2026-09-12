import { Info, Pencil, Trash } from "lucide-react";
import { SuperLineaDto } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";
import { formatFechaHora } from "../../../herramientas/formateo-de-campos/fucion-formateo";

interface Props { superLinea: SuperLineaDto; onEditar: (id: number) => void; onInfo: (id: number) => void; onDelete: (id: number) => void; }

export function DatosCards({ superLinea, onEditar, onInfo, onDelete }: Readonly<Props>) {
  const eliminada = Boolean(superLinea.deletedAt);
  return <div className={`border rounded-md px-3 py-3 ${eliminada ? "border-gray-200 bg-gray-100 dark:bg-slate-800 opacity-50" : "border-gray-200 bg-white"}`}><div className="mb-2"><p className="text-xs text-gray-500">Denominación</p><p className="text-sm font-medium text-gray-800 line-clamp-2">{superLinea.denominacion}</p>{eliminada && <p className="text-xs text-red-500 font-medium mt-0.5">Eliminada el {formatFechaHora(superLinea.deletedAt)}</p>}</div>{superLinea.observacion && <div className="mb-3"><p className="text-xs text-gray-500">Observación</p><p className="text-sm text-gray-700 line-clamp-2">{superLinea.observacion}</p></div>}{!eliminada && <div className="flex justify-end gap-1 pt-2 border-t border-gray-100"><ActionButton variant="info" title="Ver información" onClick={() => onInfo(superLinea.id)}><Info size={16} /></ActionButton><ActionButton variant="edit" title="Editar" onClick={() => onEditar(superLinea.id)}><Pencil size={16} /></ActionButton><ActionButton variant="delete" title="Eliminar" disabled={Boolean(superLinea.sistema)} onClick={() => onDelete(superLinea.id)}><Trash size={16} /></ActionButton></div>}</div>;
}
