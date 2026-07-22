import * as bizSdk from 'facebook-nodejs-business-sdk'
import crypto from 'crypto'

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

function hashData(data: string | undefined | null): string | undefined {
  if (!data) return undefined
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex')
}

export const sendPurchaseEvent = async (order: any) => {
  if (!accessToken || !pixelId) {
    console.warn('[Meta CAPI] Missing META_CONVERSIONS_API_ACCESS_TOKEN or META_PIXEL_ID')
    return
  }

  try {
    const userData = new UserData()
    
    if (order.email) {
      userData.setEmails([hashData(order.email)])
    }
    
    if (order.shipping_address?.phone) {
      userData.setPhones([hashData(order.shipping_address.phone)])
    }
    if (order.shipping_address?.first_name) {
      userData.setFirstNames([hashData(order.shipping_address.first_name)])
    }
    if (order.shipping_address?.last_name) {
      userData.setLastNames([hashData(order.shipping_address.last_name)])
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
