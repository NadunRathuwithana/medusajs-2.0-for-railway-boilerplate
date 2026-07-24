// Shared "is this cart actually ready to complete checkout" logic, used by
// both the Payment step's submit-button gating (payment-button) and the
// Review step's warning banner (review) — previously these were two
// separate, shallower checks (e.g. `!cart.shipping_address` only checked
// the object existed, not that its fields were filled in) that could
// disagree, letting a cart with blank/invalid contact fields reach
// placeOrder() anyway.

const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidPhone(phone?: string | null): boolean {
  return !!phone && PHONE_PATTERN.test(phone.trim())
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
 * True when the cart is missing (or has invalid) required checkout details —
 * email, shipping address, billing address, or a selected shipping method
 * (unless the order is fully paid by gift card, which skips shipping).
 */
export function isCheckoutIncomplete(cart: any): boolean {
  if (!cart) return true

  const paidByGiftcard =
    cart.gift_cards && cart.gift_cards.length > 0 && cart.total === 0

  return (
    !isValidEmail(cart.email) ||
    !isAddressComplete(cart.shipping_address) ||
    !isAddressComplete(cart.billing_address) ||
    ((cart.shipping_methods?.length ?? 0) < 1 && !paidByGiftcard)
  )
}
