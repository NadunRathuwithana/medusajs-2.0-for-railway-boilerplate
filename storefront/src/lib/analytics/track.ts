"use client"

const isClient = typeof window !== "undefined"

// Meta Pixel rejects any currency that isn't an uppercase 3-letter ISO 4217
// code ("[Meta Pixel] - Invalid parameter format for currency"). Medusa
// stores/returns currency_code lowercase (e.g. "lkr"), and two call sites
// (CheckoutTracker's InitiateCheckout, PurchaseTracker's Purchase) were
// passing it straight through unnormalized — this is the root cause of that
// console warning. Normalizing centrally here means every current and future
// call site is covered, not just the ones a caller remembers to .toUpperCase().
const normalizeCurrency = (currency: string | undefined | null): string =>
  (currency || "LKR").toString().trim().toUpperCase()

export const trackViewItemList = (list: {
  listId: string
  listName: string
  currency: string
  items: { id: string; name: string; price: number }[]
}) => {
  if (!isClient) return

  if (window.gtag) {
    window.gtag("event", "view_item_list", {
      item_list_id: list.listId,
      item_list_name: list.listName,
      currency: normalizeCurrency(list.currency),
      items: list.items.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        item_list_id: list.listId,
        item_list_name: list.listName,
        index,
      })),
    })
  }
}

export const trackSearch = (search: { query: string; resultCount: number }) => {
  if (!isClient) return

  if (window.fbq) {
    window.fbq("track", "Search", {
      search_string: search.query,
      content_type: "product",
    })
  }

  if (window.gtag) {
    window.gtag("event", "search", {
      search_term: search.query,
    })
  }
}

export const trackViewContent = (product: { id: string; name: string; price: number; currency: string }) => {
  if (!isClient) return

  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: normalizeCurrency(product.currency),
    })
  }

  if (window.gtag) {
    window.gtag("event", "view_item", {
      currency: normalizeCurrency(product.currency),
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: 1,
        },
      ],
    })
  }
}

export const trackAddToCart = (item: { id: string; name: string; price: number; quantity: number; currency: string }) => {
  if (!isClient) return

  if (window.fbq) {
    window.fbq("track", "AddToCart", {
      content_ids: [item.id],
      content_name: item.name,
      content_type: "product",
      value: item.price * item.quantity,
      currency: normalizeCurrency(item.currency),
    })
  }

  if (window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: normalizeCurrency(item.currency),
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    })
  }
}

export const trackInitiateCheckout = (cart: { items: any[]; total: number; currency: string }) => {
  if (!isClient) return

  const content_ids = cart.items.map((i) => i.variant_id || i.id)

  if (window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_ids,
      content_type: "product",
      value: cart.total,
      currency: normalizeCurrency(cart.currency),
      num_items: cart.items.length,
    })
  }

  if (window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency: normalizeCurrency(cart.currency),
      value: cart.total,
      items: cart.items.map((i) => ({
        item_id: i.variant_id || i.id,
        item_name: i.title,
        price: i.unit_price,
        quantity: i.quantity,
      })),
    })
  }
}

export const trackPurchase = (
  order: { id: string; total: number; currency: string; items: any[] },
  eventId: string
) => {
  if (!isClient) return

  const content_ids = order.items.map((i) => i.variant_id || i.id)

  if (window.fbq) {
    window.fbq(
      "track",
      "Purchase",
      {
        content_ids,
        content_type: "product",
        value: order.total,
        currency: normalizeCurrency(order.currency),
        num_items: order.items.length,
      },
      { eventID: eventId }
    )
  }

  if (window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: order.id,
      value: order.total,
      currency: normalizeCurrency(order.currency),
      items: order.items.map((i) => ({
        item_id: i.variant_id || i.id,
        item_name: i.title,
        price: i.unit_price,
        quantity: i.quantity,
      })),
    })
  }
}

// GA4 standard ecommerce event — fired when the customer's shipping method
// is set. Previously never implemented at all, which is why GA4's checkout
// funnel exploration showed 0% for this step even though purchases were
// happening: a funnel requires each named step to fire in session order, and
// this step simply never existed to advance through.
export const trackAddShippingInfo = (cart: {
  items: any[]
  total: number
  currency: string
  shippingTier?: string
}) => {
  if (!isClient) return

  if (window.gtag) {
    window.gtag("event", "add_shipping_info", {
      currency: normalizeCurrency(cart.currency),
      value: cart.total,
      shipping_tier: cart.shippingTier,
      items: cart.items.map((i) => ({
        item_id: i.variant_id || i.id,
        item_name: i.title,
        price: i.unit_price,
        quantity: i.quantity,
      })),
    })
  }
}

// GA4 standard ecommerce event, plus Meta's matching standard "AddPaymentInfo"
// pixel event — fired when a payment method/session is selected. Meta had no
// signal here at all beyond InitiateCheckout and Purchase (a "thin" funnel for
// ad delivery); this fills that gap on the client side.
export const trackAddPaymentInfo = (cart: {
  items: any[]
  total: number
  currency: string
  paymentType?: string
}) => {
  if (!isClient) return

  const content_ids = cart.items.map((i) => i.variant_id || i.id)

  if (window.fbq) {
    window.fbq("track", "AddPaymentInfo", {
      content_ids,
      content_type: "product",
      value: cart.total,
      currency: normalizeCurrency(cart.currency),
    })
  }

  if (window.gtag) {
    window.gtag("event", "add_payment_info", {
      currency: normalizeCurrency(cart.currency),
      value: cart.total,
      payment_type: cart.paymentType,
      items: cart.items.map((i) => ({
        item_id: i.variant_id || i.id,
        item_name: i.title,
        price: i.unit_price,
        quantity: i.quantity,
      })),
    })
  }
}
