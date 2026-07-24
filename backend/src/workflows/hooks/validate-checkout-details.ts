import { MedusaError } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Defense-in-depth for cart completion: the storefront already validates
 * (and re-validates against the live cart in placeOrder()) that email,
 * phone, and address fields are present and well-formed before calling
 * complete-cart — but Medusa's core cart-update validators accept blank
 * strings for phone/address fields, and this workflow itself never checked
 * them. Enforcing it here too means an order can't be placed with missing
 * contact/address info even via a direct API call that bypasses the
 * storefront entirely.
 */
const PHONE_PATTERN = /^\+?[0-9\s\-()]{7,20}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isAddressComplete(address: any): boolean {
  return !!(
    address?.first_name &&
    address?.last_name &&
    address?.address_1 &&
    address?.city &&
    address?.postal_code &&
    address?.country_code &&
    address?.phone &&
    PHONE_PATTERN.test(String(address.phone).trim())
  )
}

completeCartWorkflow.hooks.validate(async ({ cart }) => {
  const paidByGiftcard =
    cart.gift_cards?.length > 0 && cart.total === 0

  const email = cart.email as string | undefined
  if (!email || !EMAIL_PATTERN.test(email.trim())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A valid email address is required to place an order."
    )
  }

  if (!isAddressComplete(cart.shipping_address)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A complete shipping address, including a valid phone number, is required to place an order."
    )
  }

  if (!isAddressComplete(cart.billing_address)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A complete billing address, including a valid phone number, is required to place an order."
    )
  }

  if (!paidByGiftcard && (cart.shipping_methods?.length ?? 0) < 1) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A shipping method is required to place an order."
    )
  }
})
