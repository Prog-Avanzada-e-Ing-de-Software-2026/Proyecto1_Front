import { useCallback, useEffect, useRef, useState } from "react";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../herramientas/alertas/alertas";
import { TipoAlertaConfirmacion, TituloAlertaConfirmacion, useConfirmation } from "../../../herramientas/alertas/alertas-confirmacion";
import Paginacion from "../../../herramientas/reutilizables/paginacion";
import { Card, CardContent } from "../../../ui/Card";
import { getUsuarioId } from "../../../../utils/auth";
import { parseApiError } from "../../../../utils/errores";
import { SuperLineaDto } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { DatosCards } from "../componentes/datos-card";
import { DatosTabla } from "../componentes/datos-tabla";
import { FiltrosSuperlinea, FiltrosSuperlineaValues } from "../componentes/filtros-superlinea";
import { Header } from "../componentes/header";
import { HeaderLg } from "../componentes/header-lg";
import { useSuperLineaModal } from "../hooks/use-superlinea-modal";
import { SuperLineaModal } from "../modales/superlinea-modal";
import SuperLineaService from "../services/superlinea-service";

export default function ConsultarSuperlineas() {
  const [superLineas, setSuperLineas] = useState<SuperLineaDto[]>([]);
  const [filtros, setFiltros] = useState<FiltrosSuperlineaValues>({ denominacion: "" });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);
  const { alerts, addAlert, removeAlert } = useAlerts();
  const addAlertRef = useRef(addAlert);
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();
  const modal = useSuperLineaModal();
  const usuarioId = getUsuarioId();

  useEffect(() => {
    addAlertRef.current = addAlert;
  }, [addAlert]);

  const buscar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await SuperLineaService.obtener({
        denominacion: filtros.denominacion,
        incluirEliminados: filtros.incluirEliminados || undefined,
        skip,
        take,
      });
      setSuperLineas(response.data);
      setTotal(response.total);
    } catch (error) {
      addAlertRef.current({ type: TipoAlerta.ERROR, title: TituloAlerta.ERROR, message: parseApiError(error), autoClose: true });
    } finally {
      setLoading(false);
    }
  }, [filtros, skip, take]);

  useEffect(() => { buscar(); }, [buscar]);

  const onFiltros = (values: FiltrosSuperlineaValues) => {
    setSkip(0);
    setPaginaActual(1);
    setFiltros(values);
  };

  const abrirEdicion = async (id: number) => {
    try { modal.abrirEdicion(await SuperLineaService.obtenerId(id)); }
    catch (error) { addAlert({ type: TipoAlerta.ERROR, title: TituloAlerta.ERROR, message: parseApiError(error), autoClose: true }); }
  };

  const abrirAuditoria = async (id: number) => {
    try { modal.abrirAuditoria(await SuperLineaService.obtenerAuditoria(id)); }
    catch (error) { addAlert({ type: TipoAlerta.ERROR, title: TituloAlerta.ERROR, message: parseApiError(error), autoClose: true }); }
  };

  const eliminar = async (id: number) => {
    const confirmed = await showConfirmation({ type: TipoAlertaConfirmacion.DESTRUCTIVE, title: TituloAlertaConfirmacion.DESTRUCTIVE, message: "¿Estás seguro de que quieres eliminar esta SuperLínea?", confirmText: "Eliminar", cancelText: "Cancelar", onConfirm: () => {} });
    if (!confirmed) return;
    try {
      const response = await SuperLineaService.eliminar(id, usuarioId);
      addAlert({ type: TipoAlerta.SUCCESS, title: TituloAlerta.SUCCESS, message: response.mensaje, autoClose: true });
      await buscar();
    } catch (error) {
      addAlert({ type: TipoAlerta.ERROR, title: TituloAlerta.ERROR, message: parseApiError(error), autoClose: true });
    }
  };

  const onSuccess = async (message: string) => {
    modal.cerrar();
    addAlert({ type: TipoAlerta.SUCCESS, title: TituloAlerta.SUCCESS, message, autoClose: true });
    await buscar();
  };

  return <div className="w-full p-6"><Card><div className="hidden lg:block"><Header entidadesTotales={total} datosLength={superLineas.length} openModal={modal.abrirAlta} /></div><div className="lg:hidden"><HeaderLg openModal={modal.abrirAlta} /></div><CardContent className="p-0"><FiltrosSuperlinea onBuscar={onFiltros} mostrarIncluirEliminados />{loading ? <div className="flex flex-col items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" /><p className="text-gray-600 text-lg">Cargando SuperLíneas...</p></div> : <><div className="hidden lg:block"><DatosTabla superLineas={superLineas} onEditar={abrirEdicion} onInfo={abrirAuditoria} onDelete={eliminar} /></div><div className="lg:hidden space-y-4">{superLineas.map((superLinea) => <DatosCards key={superLinea.id} superLinea={superLinea} onEditar={abrirEdicion} onInfo={abrirAuditoria} onDelete={eliminar} />)}</div></>}</CardContent></Card><div className="mt-6"><Paginacion entidadesTotales={total} take={take} paginaActual={paginaActual} onChange={(newSkip, newTake, page) => { setSkip(newSkip); setTake(newTake); setPaginaActual(page); }} /></div><Alertas alerts={alerts} onRemove={removeAlert} /><AlertasConfirmacion /><SuperLineaModal open={modal.tipo !== null} tipo={modal.tipo} superLinea={modal.superLinea} auditoria={modal.auditoria} onClose={modal.cerrar} onSuccess={onSuccess} /></div>;
}
