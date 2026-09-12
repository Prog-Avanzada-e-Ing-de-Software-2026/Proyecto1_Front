import { Button } from "../../../ui/Button";
import InformacionAuditoria from "../../../herramientas/reutilizables/informacion-auditoria";
import { Auditoria } from "../../../../interfaces/generales/interfaces-generales";
import { SuperLineaDto } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { SuperLineaModalTipo } from "../hooks/use-superlinea-modal";
import RegistrarSuperlinea from "../utils/registrar-superlinea";

interface Props {
  open: boolean;
  tipo: SuperLineaModalTipo;
  superLinea: SuperLineaDto | null;
  auditoria: Auditoria | null;
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}

export function SuperLineaModal({ open, tipo, superLinea, auditoria, onClose, onSuccess }: Readonly<Props>) {
  if (!open || !tipo) return null;

  if (tipo === "auditoria" && auditoria) {
    return <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"><InformacionAuditoria auditoria={auditoria} onClose={onClose} /><div className="mt-6 pt-4 border-t"><Button onClick={onClose}>Cerrar</Button></div></div></div>;
  }

  if (tipo === "alta") return <RegistrarSuperlinea onClose={onClose} onSuccess={onSuccess} />;
  return superLinea ? <RegistrarSuperlinea superLinea={superLinea} onClose={onClose} onSuccess={onSuccess} /> : null;
}
