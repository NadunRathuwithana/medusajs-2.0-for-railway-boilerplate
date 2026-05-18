"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="w-full flex flex-col"
      data-testid="register-page"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize tracking-tight text-bold mb-2">
          Become a Member
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Create your profile to unlock custom carry personalization, saved checkout preferences, and member-only rewards.
        </p>
      </div>

      <form className="w-full flex flex-col gap-y-4" action={formAction}>
        <div className="flex flex-col w-full gap-y-3.5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              name="first_name"
              required
              autoComplete="given-name"
              data-testid="first-name-input"
            />
            <Input
              label="Last name"
              name="last_name"
              required
              autoComplete="family-name"
              data-testid="last-name-input"
            />
          </div>
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>

        <ErrorMessage error={message} data-testid="register-error" />

        <p className="text-[11px] leading-relaxed text-gray-400 font-medium mt-4">
          By creating an account, you agree to Cardle&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="text-bold hover:text-gray-700 underline font-bold"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="text-bold hover:text-gray-700 underline font-bold"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </p>

        <SubmitButton 
          className="w-full mt-6 bg-black text-white hover:bg-zinc-900 transition-colors duration-200 py-3.5 rounded-full text-xs font-bold tracking-widest capitalize shadow-sm"
          data-testid="register-button"
        >
          Join Now
        </SubmitButton>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-medium capitalize tracking-wider text-gray-500">
        <span>Already a member?</span>
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="text-bold hover:text-gray-700 underline font-bold transition-colors"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

export default Register
