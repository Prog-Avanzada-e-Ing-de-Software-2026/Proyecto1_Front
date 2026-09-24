import { useCallback, useId } from "react";
import { useFormContext, useController } from "react-hook-form";
import { Label } from "@radix-ui/react-label";
import { Input } from "../../ui/Input";
import { useMask } from "@react-input/mask";

type FormInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  defaultValue?: string;
  classNameDisabled?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  mask?: string;
};

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

export default function FormInput({
  name,
  label,
  placeholder,
  type,
  mask,
  className,
  classNameDisabled,
  disabled,
  style,
  defaultValue,
  onKeyDown,
  onBlur,
  inputRef,
}: FormInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { field } = useController({ name, control, defaultValue });
  const id = useId();
  const errorId = `${id}-error`;

  // Hook de máscara (solo si se pasa mask)
  const maskRef = mask
    ? useMask({
        mask,
        replacement: { _: /\d/ }, // "_" representa un dígito
      })
    : null;

  const setRefs = useCallback(
    (el: HTMLInputElement | null) => {
      field.ref(el);
      setRef(maskRef, el);
      setRef(inputRef, el);
    },
    [field, inputRef, maskRef],
  );

  const fieldError = getFieldError(errors, name);
  const errorMessage = fieldError?.message as string | undefined;
  const hasError = !!fieldError;

  return (
    <div className={`space-y-1 sm:space-y-2 ${className || ""}`}>
      <Label htmlFor={id} className="label-base">
        {label}
      </Label>
      <div className="relative">
        <Input
          {...field}
          id={id}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          style={style}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            field.onBlur();
            onBlur?.(e);
          }}
          ref={setRefs}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={
            classNameDisabled
              ? classNameDisabled
              : "pl-10 w-full px-3 sm:px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-sm sm:text-base"
          }
        />
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
    </div>
  );
}
