import { FieldError } from "@/components/ui/field";

interface FormSubmitErrorProps {
  message: string | null;
}

export function FormSubmitError({ message }: FormSubmitErrorProps) {
  if (!message) return null;

  return (
    <FieldError className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
      {message}
    </FieldError>
  );
}
