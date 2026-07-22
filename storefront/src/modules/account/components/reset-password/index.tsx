"use client"

import { useActionState, useEffect } from "react"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { resetPassword } from "@lib/data/customer"

type Props = {
  token: string
  email: string
}

const ResetPassword = ({ token, email }: Props) => {
  const [message, formAction] = useActionState(resetPassword, null)

  useEffect(() => {
    if (message === "SUCCESS") {
      window.location.href = "/account"
    }
  }, [message])

  return (
    <div
      className="w-full flex flex-col"
      data-testid="reset-password-page"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize tracking-tight text-bold mb-2">
          New password
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Enter your new password below.
        </p>
      </div>

      <form className="w-full flex flex-col gap-y-4" action={formAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        
        <div className="flex flex-col w-full gap-y-3.5">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your new password"
            required
            data-testid="password-input"
          />
        </div>
        
        <ErrorMessage error={message === "SUCCESS" ? null : message} data-testid="reset-password-error-message" />
        
        <SubmitButton 
          data-testid="reset-password-button" 
          className="w-full mt-6 bg-black text-white hover:bg-zinc-900 transition-colors duration-200 py-3.5 rounded-full text-xs font-bold tracking-widest capitalize shadow-sm"
        >
          Reset password
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
