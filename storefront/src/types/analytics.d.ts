interface Window {
  fbq?: any
  _fbq?: any
  gtag?: any
  dataLayer?: any[]
}

declare module "meta-capi-param-builder-clientjs" {
  export function processAndCollectAllParams(
    url?: string,
    getIpFn?: () => string | Promise<string>
  ): Promise<Record<string, string>>
  export function getFbc(): string | null
  export function getFbp(): string | null
  export function getClientIpAddress(): string
  export function getNormalizedAndHashedPII(
    value: string,
    dataType: string
  ): string | null
}
