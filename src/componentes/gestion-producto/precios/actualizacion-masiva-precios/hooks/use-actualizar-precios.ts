import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useConfirmation, TipoAlertaConfirmacion } from "../../../../herramientas/alertas/alertas-confirmacion";
import { ActualizarPreciosService } from "../services/actualizar-precios-service";
import type { ActualizarPreciosRequest, ActualizarPreciosResponse, LineaPrecios } from "../interfaces/actualizar-precios";
import { resumenAjuste } from "../utils/crear-payload";
import { errorPrecios } from "../utils/error-precios";

export function useActualizarPrecios() {
  const [lineas, setLineas] = useState<LineaPrecios[]>([]);
  const [cargandoLineas, setCargandoLineas] = useState(true);
  const [errorLineas, setErrorLineas] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesionVencida, setSesionVencida] = useState(false);
  const [resultado, setResultado] = useState<ActualizarPreciosResponse | null>(null);
  const ocupado = useRef(false);
  const cargaId = useRef(0);
  const montado = useRef(true);
  const navigate = useNavigate();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const verificarSesion = useCallback((error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setSesionVencida(true);
    }
  }, []);

  const cargarLineas = useCallback(async () => {
    const id = ++cargaId.current;
    setCargandoLineas(true);
    setErrorLineas(null);
    setLineas([]);
    try {
      const opciones = await ActualizarPreciosService.obtenerLineas();
      if (montado.current && id === cargaId.current) setLineas(opciones);
    } catch (error) {
      if (montado.current && id === cargaId.current) {
        setErrorLineas(errorPrecios(error));
        verificarSesion(error);
      }
    } finally {
      if (montado.current && id === cargaId.current) setCargandoLineas(false);
    }
  }, [verificarSesion]);

  useEffect(() => {
    montado.current = true;
    void cargarLineas();
    return () => {
      montado.current = false;
    };
  }, [cargarLineas]);

  const actualizar = async (payload: ActualizarPreciosRequest) => {
    if (ocupado.current || sesionVencida) return;
    const linea = lineas.find((item) => item.id === payload.lineaId);
    if (payload.lineaId && (!linea || cargandoLineas || errorLineas)) {
      setError("Seleccioná una Línea disponible antes de continuar.");
      return;
    }
    ocupado.current = true;
    setPendiente(true);
    setError(null);
    try {
      const confirmado = await showConfirmation({
        type: TipoAlertaConfirmacion.WARNING,
        title: "Confirmar actualización de precios",
        message: resumenAjuste(payload, linea?.denominacion),
        confirmText: "Actualizar precios",
        cancelText: "Cancelar",
        onConfirm: () => {},
      });
      if (!confirmado || !montado.current) return;
      setResultado(null);
      setEnviando(true);
      const response = await ActualizarPreciosService.actualizar(payload);
      if (montado.current) setResultado(response);
    } catch (error) {
      if (montado.current) {
        setError(errorPrecios(error));
        verificarSesion(error);
      }
    } finally {
      ocupado.current = false;
      if (montado.current) {
        setPendiente(false);
        setEnviando(false);
      }
    }
  };

  const iniciarSesion = () => {
    localStorage.removeItem("Token");
    navigate("/login", { replace: true });
  };

  return { lineas, cargandoLineas, errorLineas, cargarLineas, pendiente, enviando,
    error, resultado, actualizar, AlertasConfirmacion, sesionVencida, iniciarSesion };
}
