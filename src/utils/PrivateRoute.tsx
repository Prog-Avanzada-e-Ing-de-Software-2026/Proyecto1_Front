import { Navigate, useLocation, useNavigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AlertasConfirmacion, TipoAlertaConfirmacion } from "../componentes/herramientas/alertas/alertas-confirmacion";

interface PrivateRouteProps {
  allowedRoles: number[];
}

function AccesoDenegado() {
  const navigate = useNavigate();
  const volver = () => navigate("/admin", { replace: true });
  return (
    <AlertasConfirmacion isOpen onClose={volver} onConfirm={volver}
      type={TipoAlertaConfirmacion.WARNING_ERROR} title="Advertencia"
      message="No tienes permiso para acceder a esta sección." confirmText="Aceptar" />
  );
}

export default function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("Token");
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  let roles: number[];
  try {
    const decoded = jwtDecode<{ roles?: number[] }>(token);
    if (!Array.isArray(decoded.roles)) throw new Error("Roles inválidos");
    roles = decoded.roles;
  } catch {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return roles.some((role) => allowedRoles.includes(role)) ? <Outlet /> : <AccesoDenegado />;
}
