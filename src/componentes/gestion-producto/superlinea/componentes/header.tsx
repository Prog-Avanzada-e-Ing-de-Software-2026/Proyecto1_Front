import { Layers, PlusCircle } from "lucide-react";
import { Button } from "../../../ui/Button";
import { CardHeader, CardTitle } from "../../../ui/Card";
import { EstadisticasSimples } from "../../../herramientas/reutilizables/estadisticas-simples";

export function Header({ entidadesTotales, datosLength, openModal }: Readonly<{
  entidadesTotales: number;
  datosLength: number;
  openModal: () => void
}>) {
  return <CardHeader className="flex flex-row items-center justify-between p-4 gap-4"><div className="flex items-center gap-6"><CardTitle className="flex items-center space-x-2"><Layers className="consultar-icon w-5 h-5 sm:w-6 sm:h-6" /><span className="text-base sm:text-xl font-semibold">SuperLíneas</span></CardTitle><EstadisticasSimples filtrados={entidadesTotales} mostrados={datosLength} /></div><Button className="bg-blue-500 hover:bg-blue-700 text-white flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-sm" onClick={openModal}><PlusCircle className="h-4 w-4" /></Button></CardHeader>;
}
