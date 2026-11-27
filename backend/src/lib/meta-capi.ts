import * as bizSdk from 'facebook-nodejs-business-sdk'
import { ParamBuilder, PII_DATA_TYPE } from 'capi-param-builder-nodejs'

const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN
const pixelId = process.env.META_PIXEL_ID
const testEventCode = process.env.META_TEST_EVENT_CODE

if (accessToken) {
  bizSdk.FacebookAdsApi.init(accessToken)
}

const ServerEvent = bizSdk.ServerEvent
const EventRequest = bizSdk.EventRequest
const UserData = bizSdk.UserData
const CustomData = bizSdk.CustomData

// Pure normalize+hash helper — no request context needed for this method.
const paramBuilder = new ParamBuilder()

// Sri Lankan numbers are stored as 07X... or 7X...; Meta needs E.164 digits.
function toE164LK(raw: string): string {
  let d = String(raw).replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('94')) return d
  if (d.startsWith('0')) d = d.slice(1)
  return d.length === 9 ? '94' + d : d
}

function hashPII(value: string | undefined | null, dataType: string): string | undefined {
  if (!value) return undefined
  return paramBuilder.getNormalizedAndHashedPII(value, dataType) ?? undefined
}

export const sendPurchaseEvent = async (order: any) => {
  if (!accessToken || !pixelId) {
    console.warn('[Meta CAPI] Missing META_CONVERSIONS_API_ACCESS_TOKEN or META_PIXEL_ID')
    return
  }

  try {
    const userData = new UserData()

    if (order.email) {
      userData.setEmails([hashPII(order.email, PII_DATA_TYPE.EMAIL)])
    }
    if (order.shipping_address?.phone) {
      userData.setPhones([hashPII(toE164LK(order.shipping_address.phone), PII_DATA_TYPE.PHONE)])
    }
    if (order.shipping_address?.first_name) {
      userData.setFirstNames([hashPII(order.shipping_address.first_name, PII_DATA_TYPE.FIRST_NAME)])
    }
    if (order.shipping_address?.last_name) {
      userData.setLastNames([hashPII(order.shipping_address.last_name, PII_DATA_TYPE.LAST_NAME)])
    }
    const addr = order.shipping_address || {}
    if (addr.city) userData.setCities([hashPII(addr.city, PII_DATA_TYPE.CITY)])
    if (addr.postal_code) userData.setZips([hashPII(addr.postal_code, PII_DATA_TYPE.ZIP_CODE)])
    userData.setCountries([hashPII(addr.country_code || 'lk', PII_DATA_TYPE.COUNTRY)])
    if (order.metadata?.client_user_agent) {
      userData.setClientUserAgent(order.metadata.client_user_agent)
    }
    if (order.customer?.id) {
      userData.setExternalId(hashPII(order.customer.id, PII_DATA_TYPE.EXTERNAL_ID))
    }

    // Captured client-side (storefront MetaParamSync) and carried through as cart
    // metadata into order.metadata by placeOrder() — see storefront lib/data/cart.ts.
    if (order.metadata?.fbc) {
      userData.setFbc(order.metadata.fbc)
    }
    if (order.metadata?.fbp) {
      userData.setFbp(order.metadata.fbp)
    }
    if (order.metadata?.client_ip_address) {
      userData.setClientIpAddress(order.metadata.client_ip_address)
    }

    // Packing lines are internal, not products customers buy.
    const items = (order.items || []).filter((i: any) => i?.metadata?.packing !== true)
    const content_ids = items.map((item: any) => item.variant_id || item.id)
    const contents = items.map((i: any) => ({ id: i.variant_id || i.id, quantity: Number(i.quantity) || 1, item_price: Number(i.unit_price) || 0 }))
    const numItems = items.reduce((n: number, i: any) => n + (Number(i.quantity) || 1), 0)

    const customData = new CustomData()
      .setContentIds(content_ids)
      .setContentType('product')
      .setValue(Number(order.total) || 0)
      .setCurrency(order.currency_code?.toUpperCase() || 'LKR')
      .setNumItems(numItems || 1)
      .setContents(contents.map((c: any) => new bizSdk.Content().setId(c.id).setQuantity(c.quantity).setItemPrice(c.item_price)))

    const serverEvent = new ServerEvent()
      .setEventName('Purchase')
      .setEventTime(Math.floor(Date.now() / 1000))
      .setEventId(order.id) // Used for deduplication with Meta Pixel
      .setUserData(userData)
      .setCustomData(customData)
      .setActionSource('website')

    serverEvent.setEventSourceUrl(
      order.metadata?.event_source_url ||
        `${process.env.STORE_URL || 'https://cardle.lk'}/lk/order/confirmed/${order.id}`
    )

    const eventsData = [serverEvent]
    const eventRequest = new EventRequest(accessToken, pixelId).setEvents(eventsData)

    if (testEventCode) {
      eventRequest.setTestEventCode(testEventCode)
    }

    const response: any = await eventRequest.execute()
    console.log(`[Meta CAPI] Purchase sent for ${order.id} (events_received=${response?.events_received ?? '?'})`)
  } catch (error: any) {
    // Never log the error object: the SDK keeps the request URL (with the
    // access token) and the hashed payload on it.
    const msg = error?.response?.error?.message || error?.message || 'unknown error'
    console.error(`[Meta CAPI] Purchase failed for ${order?.id}: ${String(msg).replace(/access_token=[^&\s]+/g, 'access_token=[REDACTED]')}`)
  }
}
