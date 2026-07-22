import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  label?: string
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    { placeholder = "Select...", defaultValue, value, className, children, label, required, name, ...props },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    return (
      <div className="flex flex-col w-full gap-1.5">
        {label && (
          <label
            htmlFor={name}
            className="text-[13px] font-medium text-gray-700 ml-1"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        
        <div
          className={clx(
            "relative flex items-center w-full",
            className
          )}
        >
          <select
            ref={innerRef}
            name={name}
            id={name}
            required={required}
            value={value !== undefined ? value : undefined}
            defaultValue={value !== undefined ? undefined : defaultValue}
            {...props}
            className="appearance-none block w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option disabled value="">
              {placeholder}
            </option>
            {children}
          </select>
          <span className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-gray-500">
            <ChevronUpDown className="w-5 h-5" />
          </span>
        </div>
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
