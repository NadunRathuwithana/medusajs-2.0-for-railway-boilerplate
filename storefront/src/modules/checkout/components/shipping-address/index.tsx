import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import { isValidEmail, isValidPhone, cleanPhone } from "@lib/util/checkout-validation"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code":
          address?.country_code?.toLowerCase() || "", 
        "shipping_address.phone": address?.phone ? cleanPhone(address.phone) : "",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    const updatedValue = name.endsWith(".phone") || name === "phone" ? cleanPhone(value) : value
    setFormData({
      ...formData,
      [name]: updatedValue,
    })
  }

  // In-page validation errors, replacing the browser's native tooltip/red
  // outline. Only shown once a field has been "touched" (blurred at least
  // once) — so an empty required field doesn't already look like an error
  // before the user has even had a chance to fill it in.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }
  const fieldError = (name: string, isValid: boolean, message: string) =>
    touched[name] && !isValid ? message : undefined

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.first_name",
            !!formData["shipping_address.first_name"],
            "First name is required"
          )}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.last_name",
            !!formData["shipping_address.last_name"],
            "Last name is required"
          )}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.address_1",
            !!formData["shipping_address.address_1"],
            "Address is required"
          )}
          required
          wrapperClassName="col-span-2"
          data-testid="shipping-address-input"
        />
        <Input
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"] || ""}
          onChange={handleChange}
          autoComplete="organization"
          wrapperClassName="col-span-2"
          data-testid="shipping-company-input"
        />
        <Input
          label="Postal code"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.postal_code",
            !!formData["shipping_address.postal_code"],
            "Postal code is required"
          )}
          required
          data-testid="shipping-postal-code-input"
        />
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.city",
            !!formData["shipping_address.city"],
            "City is required"
          )}
          required
          data-testid="shipping-city-input"
        />
        <CountrySelect
          label="Country"
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"] || "lk"}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.country_code",
            !!(formData["shipping_address.country_code"] || "lk"),
            "Country is required"
          )}
          required
          wrapperClassName="col-span-2"
          data-testid="shipping-country-select"
        />
      </div>
      <div className="my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "email",
            isValidEmail(formData.email),
            "Enter a valid email address"
          )}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          type="tel"
          autoComplete="tel"
          value={formData["shipping_address.phone"] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError(
            "shipping_address.phone",
            isValidPhone(formData["shipping_address.phone"]),
            "Enter a valid phone number"
          )}
          required
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
