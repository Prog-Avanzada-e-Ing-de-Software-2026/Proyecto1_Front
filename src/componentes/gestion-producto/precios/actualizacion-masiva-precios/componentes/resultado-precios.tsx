import { formatPrice } from "../../../../herramientas/formateo-de-campos/fucion-formateo";
import type { ActualizarPreciosResponse } from "../interfaces/actualizar-precios";

export function ResultadoPrecios({ resultado }: { resultado: ActualizarPreciosResponse }) {
  return (
    <section aria-label="Resultado de la actualización" className="space-y-4">
      <div role="status" className="rounded-lg bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100">
        <p>{resultado.message}</p>
        <p className="text-sm">Productos actualizados: {resultado.productos.length.toLocaleString("es-AR")}</p>
      </div>
      <div className="max-h-[32rem] overflow-auto rounded-lg border border-gray-200 dark:border-slate-700" tabIndex={0} aria-label="Tabla de productos actualizados">
        <table className="w-full text-sm">
          <caption className="sr-only">Denominación, costo y precio resultantes</caption>
          <thead className="sticky top-0 bg-gray-100 dark:bg-slate-800">
            <tr>
              <th scope="col" className="p-3 text-left">Denominación</th>
              <th scope="col" className="p-3 text-right">Costo actualizado</th>
              <th scope="col" className="p-3 text-right">Precio actualizado</th>
            </tr>
          </thead>
          <tbody>
            {resultado.productos.map((producto, index) => (
              <tr key={index} className="border-t border-gray-200 dark:border-slate-700">
                <td className="p-3">{producto.denominacion}</td>
                <td className="whitespace-nowrap p-3 text-right">{formatPrice(producto.costo, "ARS")}</td>
                <td className="whitespace-nowrap p-3 text-right">{formatPrice(producto.precio, "ARS")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
