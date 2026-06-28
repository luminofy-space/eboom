"use client";

import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface SystemCurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function SystemCurrencySelect({
  value,
  onValueChange,
  disabled,
  placeholder = "...",
  className,
}: SystemCurrencySelectProps) {
  const { data, isLoading } = useQueryApi<{
    currencies?: { id: number; code: string; name: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
  });

  const currencies = data?.currencies ?? [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center", className ?? "h-9")}>
        <Spinner className="size-4" />
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {currencies.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.code} – {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
