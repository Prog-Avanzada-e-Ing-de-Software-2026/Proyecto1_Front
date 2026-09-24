import React, { forwardRef, useId, useRef } from "react";
import { NumericFormat } from "react-number-format";
import { Label } from "../../ui/Label";
import { useFormContext, useController } from "react-hook-form";

interface PriceInputProps {
  name: string;
  label?: string;
  value: number;
  prefix?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  maxDigits?: number;
  decimalScale?: number;
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

const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      name,
      label,
      value,
      prefix,
      disabled,
      className,
      onChange,
      onBlur,
      onKeyDown,
      maxDigits,
      decimalScale = 2,
      inputRef,
    },
    ref,
  ) => {
    const {
      control,
      formState: { errors },
    } = useFormContext();
    const { field } = useController({ name, control });
    const id = useId();
    const errorId = `${id}-error`;
    const internalRef = useRef<HTMLInputElement>(null);

    const setInputRef = (el: HTMLInputElement | null) => {
      field.ref(el);
      setRef(internalRef, el);
      setRef(ref, el);
      setRef(inputRef, el);
    };

    const handleFocus = () => {
      setTimeout(() => {
        const input = internalRef.current;
        if (input) {
          const valueStr = input.value;
          const commaIndex = valueStr.indexOf(",");
          if (commaIndex !== -1) {
            input.setSelectionRange(commaIndex, commaIndex);
          }
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "-") {
        e.preventDefault();
        onChange(0);
        return;
      }
      onKeyDown?.(e);
    };

    const fieldError = getFieldError(errors, name);
    const errorMessage = fieldError?.message as string | undefined;
    const hasError = !!fieldError;

    return (
      <div className={`space-y-1 sm:space-y-2 `}>
        {label && (
          <Label htmlFor={id} className="label-base">
            {label}
          </Label>
        )}
        <div className={`relative `}>
          <NumericFormat
            getInputRef={setInputRef}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            value={value}
            name={name}
            id={id}
            thousandSeparator="."
            decimalSeparator=","
            allowedDecimalSeparators={[",", "."]}
            decimalScale={decimalScale}
            disabled={disabled}
            isAllowed={(values) => {
              if (!maxDigits) return true;
              const maxValue = Number("9".repeat(maxDigits)); // ejemplo: 12 → 999999999999
              const currentValue = values.floatValue ?? 0;
              return currentValue <= maxValue;
            }}
            fixedDecimalScale
            allowNegative={false}
            prefix={prefix ? `${prefix} ` : "$"}
            onValueChange={(values) => {
              onChange(values.floatValue ?? 0); // si es undefined, setea 0
            }}
            onFocus={handleFocus}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={
              className // se paso className?
                ? className
                : disabled // no
                  ? "w-full text-right p-2 border border-gray-300 bg-gray-300 rounded-md text-black"
                  : "w-full text-right p-2 border border-gray-300 bg-white rounded-md text-black"
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
  },
);

PriceInput.displayName = "PriceInput";

export default PriceInput;
