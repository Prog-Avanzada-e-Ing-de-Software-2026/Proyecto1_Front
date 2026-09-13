import axios from "axios";
import { parseApiError } from "../../../../../utils/errores";

export function errorPrecios(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message = data?.message;
    if ((typeof data === "string" && data.trim()) ||
        (typeof message === "string" && message.trim()) ||
        (Array.isArray(message) && message.length > 0 && message.every((item) => typeof item === "string"))) {
      return parseApiError(error);
    }
    if (error.response?.status === 401) return "La sesión venció. Iniciá sesión nuevamente.";
    if (error.response?.status === 403) return "No tenés permisos para realizar esta operación.";
    if (error.response?.status === 404) return "No se encontró el recurso solicitado.";
    if (!error.response) return "No se pudo confirmar el resultado. Verificá la conexión y los precios antes de volver a intentar.";
  }
  return "No se pudo completar la operación. Intentá nuevamente después de verificar los precios.";
}
