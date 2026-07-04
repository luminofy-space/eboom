"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  /** When true (default), a blurred zero displays as empty so placeholders remain visible. */
  hideZeroWhenBlurred?: boolean;
};

function isZeroLike(value: unknown): boolean {
  return value === 0 || value === "0";
}

function isEmptyLike(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

function toDisplayValue(
  value: unknown,
  focused: boolean,
  hideZeroWhenBlurred: boolean
): string {
  if (isEmptyLike(value)) return "";
  if (!focused && hideZeroWhenBlurred && isZeroLike(value)) return "";
  return String(value);
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      hideZeroWhenBlurred = true,
      onFocus,
      onChange,
      onBlur,
      value,
      className,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = React.useState(false);
    const isControlled = value !== undefined;
    const displayValue = isControlled
      ? toDisplayValue(value, focused, hideZeroWhenBlurred)
      : undefined;

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      const currentValue = event.currentTarget.value;
      if (currentValue === "0") {
        event.currentTarget.value = "";
        onChange?.(
          Object.assign({}, event, {
            target: event.currentTarget,
            currentTarget: event.currentTarget,
          }) as React.ChangeEvent<HTMLInputElement>
        );
      } else if (currentValue) {
        event.currentTarget.select();
      }
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    return (
      <Input
        type="number"
        ref={ref}
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={onChange}
        className={cn(className)}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
