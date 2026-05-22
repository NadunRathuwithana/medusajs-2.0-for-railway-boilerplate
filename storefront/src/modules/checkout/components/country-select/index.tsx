import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { HttpTypes } from "@medusajs/types"

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
  }
>(({ placeholder = "Country", region, defaultValue, value, label, ...props }, ref) => {
  const innerRef = useRef<HTMLSelectElement>(null)

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  const countryOptions = useMemo(() => {
    if (!region) {
      return []
    }

    // Filter countries to only allow Sri Lanka
    return region.countries
      ?.filter((country) => country.iso_2?.toLowerCase() === "lk")
      .map((country) => ({
        value: country.iso_2,
        label: country.display_name,
      }))
  }, [region])

  return (
    <NativeSelect
      ref={innerRef}
      placeholder={placeholder}
      value={value}
      defaultValue={value !== undefined ? undefined : (defaultValue || "lk")}
      label={label || placeholder}
      {...props}
    >
      {countryOptions?.map(({ value: val, label: lbl }, index) => (
        <option key={index} value={val}>
          {lbl}
        </option>
      ))}
    </NativeSelect>
  )
})

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
