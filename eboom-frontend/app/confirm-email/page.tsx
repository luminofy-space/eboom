import { ConfirmEmailForm } from "@/src/views/authentication/ConfirmEmail";
export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ConfirmEmailForm />
      </div>
    </div>
  )
}
