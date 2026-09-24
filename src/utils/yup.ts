import * as yup from "yup";

/**
 * Reusable finiteness test for Yup number schemas.
 * Returns `true` for `null`/`undefined` so that `.required()` and
 * `.typeError()` keep their specific messages.
 */
export const finiteNumber = (message = "El valor debe ser un número finito") =>
  yup.number().test("finite", message, (value) =>
    value == null ? true : Number.isFinite(value),
  );
