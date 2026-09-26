import { useState } from "react";
import { SuperLineaDto } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { Auditoria } from "../../../../interfaces/generales/interfaces-generales";

export type SuperLineaModalTipo = "alta" | "edicion" | "auditoria" | null;

export function useSuperLineaModal() {
  const [tipo, setTipo] = useState<SuperLineaModalTipo>(null);
  const [superLinea, setSuperLinea] = useState<SuperLineaDto | null>(null);
  const [auditoria, setAuditoria] = useState<Auditoria | null>(null);

  const cerrar = () => {
    setTipo(null);
    setSuperLinea(null);
    setAuditoria(null);
  };

  return {
    tipo,
    superLinea,
    auditoria,
    cerrar,
    abrirAlta: () => { cerrar(); setTipo("alta"); },
    abrirEdicion: (value: SuperLineaDto) => { setSuperLinea(value); setAuditoria(null); setTipo("edicion"); },
    abrirAuditoria: (value: Auditoria) => { setAuditoria(value); setSuperLinea(null); setTipo("auditoria"); },
  };
}
