import { useActionState } from "react"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="w-full flex flex-col"
      data-testid="login-page"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize tracking-tight text-bold mb-2">
          Welcome back
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Sign in to access your custom Cardle dashboard, cart, and premium membership details.
        </p>
      </div>

      <form className="w-full flex flex-col gap-y-4" action={formAction}>
        <div className="flex flex-col w-full gap-y-3.5">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        
        <ErrorMessage error={message} data-testid="login-error-message" />
        
        <SubmitButton 
          data-testid="sign-in-button" 
          className="w-full mt-6 bg-black text-white hover:bg-zinc-900 transition-colors duration-200 py-3.5 rounded-full text-xs font-bold tracking-widest capitalize shadow-sm"
        >
          Sign in
        </SubmitButton>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-medium capitalize tracking-wider text-gray-500">
        <span>Not a member yet?</span>
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="text-bold hover:text-gray-700 underline font-bold transition-colors"
          data-testid="register-button"
        >
          Join us
        </button>
      </div>
    </div>
  )
}

export default Login
