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
      userData.setPhones([hashPII(order.shipping_address.phone, PII_DATA_TYPE.PHONE)])
    }
    if (order.shipping_address?.first_name) {
      userData.setFirstNames([hashPII(order.shipping_address.first_name, PII_DATA_TYPE.FIRST_NAME)])
    }
    if (order.shipping_address?.last_name) {
      userData.setLastNames([hashPII(order.shipping_address.last_name, PII_DATA_TYPE.LAST_NAME)])
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

    const content_ids = order.items?.map((item: any) => item.variant_id || item.id) || []

    const customData = new CustomData()
      .setContentIds(content_ids)
      .setContentType('product')
      .setValue(order.total)
      .setCurrency(order.currency_code?.toUpperCase() || 'LKR')
      .setNumItems(order.items?.length || 1)

    const serverEvent = new ServerEvent()
      .setEventName('Purchase')
      .setEventTime(Math.floor(Date.now() / 1000))
      .setEventId(order.id) // Used for deduplication with Meta Pixel
      .setUserData(userData)
      .setCustomData(customData)
      .setActionSource('website')

    if (order.metadata?.event_source_url) {
      serverEvent.setEventSourceUrl(order.metadata.event_source_url)
    }

    const eventsData = [serverEvent]
    const eventRequest = new EventRequest(accessToken, pixelId).setEvents(eventsData)

    if (testEventCode) {
      eventRequest.setTestEventCode(testEventCode)
    }

    const response = await eventRequest.execute()
    console.log('[Meta CAPI] Purchase event sent successfully:', response)
  } catch (error) {
    console.error('[Meta CAPI] Error sending purchase event:', error)
  }
}
