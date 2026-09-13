import { useRef, useState } from "react";
import EntidadSelectorBase from "../../../herramientas/reutilizables/entidad-selector-base";
import { SelectSuperlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

export default function SuperlineasSelector({
  superlineas,
  superLineaId,
  disabled,
  loading,
  error,
  onChange,
  onAgregar,
}: Readonly<{
  superlineas: SelectSuperlinea[];
  superLineaId?: number;
  disabled: boolean;
  loading: boolean;
  error?: string;
  onChange: (superLinea: SelectSuperlinea | null) => void;
  onAgregar: () => void;
}>) {
  const [denominacion, setDenominacion] = useState("");
  const denominacionRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  return (
    <div className="lg:col-span-5">
      <EntidadSelectorBase<SelectSuperlinea>
        titulo="SuperLíneas"
        denominacion={denominacion}
        setDenominacion={setDenominacion}
        denominacionRef={denominacionRef}
        opciones={superlineas}
        selected={null}
        selectedId={superLineaId ?? 0}
        selectRef={selectRef}
        disabled={disabled || loading}
        error={error}
        onEnterInput={(event) => event.preventDefault()}
        onChange={onChange}
        onAgregar={onAgregar}
      />
      {loading && <p className="text-sm text-gray-600 mt-1">Cargando SuperLíneas...</p>}
      {!loading && superlineas.length === 0 && (
        <p className="text-sm text-amber-700 mt-1">Primero debe registrar una SuperLínea.</p>
      )}
    </div>
  );
}
