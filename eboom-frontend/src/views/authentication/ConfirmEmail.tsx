'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ConfirmEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={`flex flex-col gap-6 ${className}`} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Email Confirmation</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to your email. Please check your inbox and click the link to confirm your email address.
          </CardDescription>
        </CardHeader>
        {/* <CardContent>
            <p>We&apos;ve sent a confirmation link to your email. Please check your inbox and click the link to confirm your email address.</p>
            <p>If you don&apos;t see the email, please check your spam folder or request a new confirmation link.</p>
        </CardContent> */}
      </Card>
    </div>
  )
}
