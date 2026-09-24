import React, { useId, useRef } from "react";
import { NumericFormat } from "react-number-format";
import { Label } from "../../ui/Label";
import { useFormContext, useController } from "react-hook-form";

interface CantidadesInputProps {
  name: string;
  label: string;
  value: number;
  disabled?: boolean;
  className?: string;
  maxDigits?: number; // ✅ Nueva prop opcional
  onChange: (value: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

function getFieldError(
  errors: unknown,
  name: string,
): { message?: unknown } | undefined {
  const parts = name.split(".");
  let current: unknown = errors;
  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "object" && current !== null
    ? (current as { message?: unknown })
    : undefined;
}

function setRef<T>(
  ref: React.Ref<T> | null | undefined,
  value: T | null,
): void {
  if (!ref) return;
  if (typeof ref === "function") {
    (ref as (instance: T | null) => void)(value);
  } else {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

const CantidadesInput: React.FC<CantidadesInputProps> = ({
  name,
  label,
  value,
  disabled,
  className,
  maxDigits = 5, // ✅ Valor por defecto si no se pasa
  onChange,
  onKeyDown,
  inputRef,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext(); // Accede al contexto
  const { field } = useController({ name, control });
  const id = useId();
  const errorId = `${id}-error`;
  const internalRef = useRef<HTMLInputElement>(null);

  const setInputRef = (el: HTMLInputElement | null) => {
    field.ref(el);
    setRef(internalRef, el);
    setRef(inputRef, el);
  };

  const fieldError = getFieldError(errors, name);
  const errorMessage = fieldError?.message as string | undefined;
  const hasError = !!fieldError;

  return (
    <div className="space-y-1 sm:space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 block mb-1"
      >
        {label}
      </Label>
      <div className="relative">
        <NumericFormat
          thousandSeparator="."
          getInputRef={setInputRef}
          onKeyDown={onKeyDown}
          value={value}
          id={id}
          decimalSeparator=","
          decimalScale={0}
          disabled={disabled}
          allowNegative={false}
          onValueChange={(values) => {
            onChange(values.floatValue ?? 0);
          }}
          isAllowed={({ floatValue }) => {
            // ✅ Limitar la cantidad de dígitos
            if (floatValue === undefined) return true;
            return floatValue.toString().length <= maxDigits;
          }}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={
            className || disabled
              ? `w-full text-right p-2 border border-gray-300 rounded-md text-black max-w-[100px] ${className}`
              : "w-full text-right p-2 border border-gray-300 bg-white rounded-md text-black max-w-[100px]"
          }
        />
      </div>
      {hasError && (
        <small
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-red-500"
        >
          {errorMessage}
        </small>
      )}
    </div>
  );
};

export default CantidadesInput;
