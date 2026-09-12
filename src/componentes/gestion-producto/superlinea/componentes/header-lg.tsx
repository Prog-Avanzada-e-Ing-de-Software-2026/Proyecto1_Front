import { Layers, PlusCircle } from "lucide-react";
import { Button } from "../../../ui/Button";
import { CardHeader, CardTitle } from "../../../ui/Card";

export function HeaderLg({ openModal }: Readonly<{ openModal: () => void }>) {
  return <CardHeader className="flex flex-row items-center justify-between p-3"><CardTitle className="flex items-center space-x-2"><Layers className="consultar-icon w-5 h-5" /><span className="text-base font-semibold">SuperLíneas</span></CardTitle><Button className="bg-blue-500 hover:bg-blue-700 text-white" onClick={openModal}><PlusCircle className="h-4 w-4" /></Button></CardHeader>;
}
