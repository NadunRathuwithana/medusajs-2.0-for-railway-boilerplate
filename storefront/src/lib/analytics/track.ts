"use client"

const isClient = typeof window !== "undefined"

export const trackViewContent = (product: { id: string; name: string; price: number; currency: string }) => {
  if (!isClient) return

  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: product.currency,
    })
  }

  if (window.gtag) {
    window.gtag("event", "view_item", {
      currency: product.currency,
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

export const trackViewItemList = (list: {
  listId: string
  listName: string
  items: { id: string; name: string; price?: number; currency?: string }[]
}) => {
  if (!isClient || !list.items.length) return

  if (window.gtag) {
    window.gtag("event", "view_item_list", {
      item_list_id: list.listId,
      item_list_name: list.listName,
      items: list.items.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        index,
      })),
    })
  }
}

export const trackSearch = (search: { term: string; resultsCount?: number }) => {
  if (!isClient || !search.term) return

  if (window.fbq) {
    window.fbq("track", "Search", {
      search_string: search.term,
      content_type: "product",
    })
  }

  if (window.gtag) {
    window.gtag("event", "search", {
      search_term: search.term,
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
      currency: item.currency,
    })
  }

  if (window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: item.currency,
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
      currency: cart.currency,
      num_items: cart.items.length,
    })
  }

  if (window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency: cart.currency,
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
        currency: order.currency,
        num_items: order.items.length,
      },
      { eventID: eventId }
    )
  }

  if (window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: order.id,
      value: order.total,
      currency: order.currency,
      items: order.items.map((i) => ({
        item_id: i.variant_id || i.id,
        item_name: i.title,
        price: i.unit_price,
        quantity: i.quantity,
      })),
    })
  }
}
