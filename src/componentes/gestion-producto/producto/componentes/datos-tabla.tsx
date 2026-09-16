import { Column, TablaAGGrid } from "../../../herramientas/tablas/tabla-flexible-ag-grid";
import { ConsultarProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { ProductoActions } from "./producto-action";

interface Props {
  productos: ConsultarProducto[];
  columns: Column<ConsultarProducto>[];
  puedeAccionar: boolean;
  puedeVerHistorialPrecios?: boolean;
  onEditar: (id: number) => void;
  onInfo: (id: number) => void;
  onDelete: (id: number) => void;
  onHistorial: (id: number, denominacion: string) => void;
  
}

export function DatosTabla({
  productos,
  columns,
  puedeAccionar,
  puedeVerHistorialPrecios = false,
  onEditar,
  onInfo,
  onDelete,
  onHistorial,
}: Props) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <TablaAGGrid
        columns={columns}
        data={productos}
        actions={
          puedeAccionar || puedeVerHistorialPrecios
            ? (row) => (
                <ProductoActions
                  producto={row}
                  onEditar={onEditar}
                  onInfo={onInfo}
                  onDelete={onDelete}
                  onHistorial={onHistorial}
                  puedeAccionar={puedeAccionar}
                  puedeVerHistorialPrecios={puedeVerHistorialPrecios}
                />
              )
            : undefined
        }
        actionsFlex={0.5}
        rowHeight={55}
      />
    </div>
  );
}
