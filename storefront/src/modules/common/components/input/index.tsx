import { Label } from "@medusajs/ui"
import React, { useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, value, defaultValue, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputType = type === "password" && showPassword ? "text" : type

    // Standardize values to avoid changing uncontrolled elements to controlled
    const finalValue = value !== undefined && value !== null ? value : undefined
    const finalDefaultValue = finalValue !== undefined ? undefined : (defaultValue !== undefined && defaultValue !== null ? defaultValue : "")

    return (
      <div className="flex flex-col w-full gap-1.5">
        <label
          htmlFor={name}
          className="text-[13px] font-medium text-gray-700 ml-1"
        >
          {topLabel || label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        
        <div className="relative w-full">
          <input
            type={inputType}
            name={name}
            id={name}
            required={required}
            className="block w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black hover:bg-gray-100 transition-colors duration-200 placeholder:text-gray-400"
            ref={ref}
            value={finalValue}
            defaultValue={finalDefaultValue}
            {...props}
          />
          
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
