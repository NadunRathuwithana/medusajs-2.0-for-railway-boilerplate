import { useActionState, useEffect } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { requestPasswordReset } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(requestPasswordReset, null)

  return (
    <div
      className="w-full flex flex-col"
      data-testid="forgot-password-page"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize tracking-tight text-bold mb-2">
          Reset password
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {message === "SUCCESS" ? (
        <div className="flex flex-col gap-y-4">
          <div className="p-4 bg-green-50 text-green-800 text-sm font-medium rounded-lg border border-green-200">
            If an account exists for that email, a password reset link has been sent. Please check your inbox.
          </div>
          <button
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="w-full mt-2 bg-black text-white hover:bg-zinc-900 transition-colors duration-200 py-3.5 rounded-full text-xs font-bold tracking-widest capitalize shadow-sm"
          >
            Return to sign in
          </button>
        </div>
      ) : (
        <form className="w-full flex flex-col gap-y-4" action={formAction}>
          <div className="flex flex-col w-full gap-y-3.5">
            <Input
              label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              placeholder="e.g. hello@cardle.lk"
              required
              data-testid="email-input"
            />
          </div>
          
          <ErrorMessage error={message} data-testid="forgot-password-error-message" />
          
          <SubmitButton 
            data-testid="send-reset-link-button" 
            className="w-full mt-6 bg-black text-white hover:bg-zinc-900 transition-colors duration-200 py-3.5 rounded-full text-xs font-bold tracking-widest capitalize shadow-sm"
          >
            Send reset link
          </SubmitButton>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center text-xs font-medium capitalize tracking-wider text-gray-500">
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="text-bold hover:text-gray-700 underline font-bold transition-colors"
          data-testid="back-to-login-button"
        >
          Back to login
        </button>
      </div>
    </div>
  )
}

export default ForgotPassword
