// Shared "is this cart actually ready to complete checkout" logic, used by
// both the Payment step's submit-button gating (payment-button) and the
// Review step's warning banner (review) — previously these were two
// separate, shallower checks (e.g. `!cart.shipping_address` only checked
// the object existed, not that its fields were filled in) that could
// disagree, letting a cart with blank/invalid contact fields reach
// placeOrder() anyway.

const PHONE_PATTERN = /^(0\d{9}|(\+94|94)\d{9})$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function cleanPhone(val: string): string {
  if (!val) return ""
  const hasLeadingPlus = val.trim().startsWith("+")
  const digitsOnly = val.replace(/\D/g, "")
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly
}

export function isValidPhone(phone?: string | null): boolean {
  return !!phone && PHONE_PATTERN.test(cleanPhone(phone))
}

export function isValidEmail(email?: string | null): boolean {
  return !!email && EMAIL_PATTERN.test(email.trim())
}

function isAddressComplete(address?: {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  city?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
} | null): boolean {
  return !!(
    address?.first_name &&
    address?.last_name &&
    address?.address_1 &&
    address?.city &&
    address?.postal_code &&
    address?.country_code &&
    isValidPhone(address?.phone)
  )
}

/**
 * True when the cart has a valid email plus complete shipping and billing
 * addresses (name, address line, city, postal code, country, valid phone).
 * Does not check shipping method — see isCheckoutIncomplete for that.
 */
export function isCartAddressesComplete(cart: any): boolean {
  return !!(
    cart &&
    isValidEmail(cart.email) &&
    isAddressComplete(cart.shipping_address) &&
    isAddressComplete(cart.billing_address)
  )
}

/**
 * True when the cart is missing (or has invalid) required checkout details —
 * email, shipping address, billing address, or a selected shipping method
 * (unless the order is fully paid by gift card, which skips shipping).
 */
export function isCheckoutIncomplete(cart: any): boolean {
  if (!cart) return true

  const paidByGiftcard =
    cart.gift_cards && cart.gift_cards.length > 0 && cart.total === 0

  return (
    !isCartAddressesComplete(cart) ||
    ((cart.shipping_methods?.length ?? 0) < 1 && !paidByGiftcard)
  )
}

/**
 * Same completeness check as isCheckoutIncomplete, but reads straight off a
 * live <form>'s FormData instead of the (server-round-trip-lagged) cart
 * object — used to validate the Addresses form's *current on-screen*
 * values instantly, on every keystroke, with zero network involved. This
 * is what lets the Payment step's submit button react in real time the
 * moment a required field is cleared, instead of only catching it after
 * the debounced save reaches the server.
 */
export function isAddressFormDataComplete(fd: FormData, prefix: string): boolean {
  const get = (key: string) => ((fd.get(`${prefix}.${key}`) as string) || "").trim()
  return !!(
    get("first_name") &&
    get("last_name") &&
    get("address_1") &&
    get("city") &&
    get("postal_code") &&
    get("country_code") &&
    isValidPhone(get("phone"))
  )
}

export function isAddressesFormComplete(fd: FormData): boolean {
  const email = ((fd.get("email") as string) || "").trim()
  const sameAsBilling = fd.get("same_as_billing") === "on"

  if (!isValidEmail(email)) return false
  if (!isAddressFormDataComplete(fd, "shipping_address")) return false
  if (!sameAsBilling && !isAddressFormDataComplete(fd, "billing_address")) return false

  return true
}
