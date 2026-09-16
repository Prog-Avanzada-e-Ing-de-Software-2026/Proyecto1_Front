import { SelectOption } from "../interfaces/generales/interfaces-generales";

export const esSelectOptionArray = (r: unknown): r is SelectOption[] => {
  if (!Array.isArray(r)) return false;

  return r.every(
    (option) =>
      !!option &&
      typeof option === "object" &&
      typeof (option as SelectOption).codigo === "number" &&
      typeof (option as SelectOption).nombre === "string" &&
      typeof (option as SelectOption).descripcion === "string",
  );
};

export const mapearSelectOptions = (
  o: SelectOption[],
): { id: number; denominacion: string }[] =>
  o.map(({ codigo, nombre }) => ({ id: codigo, denominacion: nombre }));
