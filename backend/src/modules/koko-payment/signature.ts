import crypto from "crypto"

/**
 * Normalizes a PEM key stored as a single-line env var (with literal \n)
 * back into a real multi-line PEM string.
 */
export function normalizePem(key: string): string {
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key
}

/**
 * Builds the dataString for Order Create, in Koko's EXACT required order:
 * mId + amount + currency + pluginName + pluginVersion + returnUrl + cancelUrl
 * + orderId + reference + firstName + lastName + email + description
 * + apiKey + responseUrl
 *
 * NOTE: this order is positional, not alphabetical — verified against
 * Koko's official Java reference implementation in the docs.
 */
export function buildOrderCreateDataString(fields: {
  mId: string
  amount: string
  currency: string
  pluginName: string
  pluginVersion: string
  returnUrl: string
  cancelUrl: string
  orderId: string
  reference: string
  firstName: string
  lastName: string
  email: string
  description: string
  apiKey: string
  responseUrl: string
}): string {
  return (
    fields.mId +
    fields.amount +
    fields.currency +
    fields.pluginName +
    fields.pluginVersion +
    fields.returnUrl +
    fields.cancelUrl +
    fields.orderId +
    fields.reference +
    fields.firstName +
    fields.lastName +
    fields.email +
    fields.description +
    fields.apiKey +
    fields.responseUrl
  )
}

/**
 * Builds the dataString for Order View, per the Merchant Order View docs:
 * MerchantID + PluginName + PluginVersion + OrderID + APIKey
 */
export function buildOrderViewDataString(fields: {
  mId: string
  pluginName: string
  pluginVersion: string
  orderId: string
  apiKey: string
}): string {
  return (
    fields.mId +
    fields.pluginName +
    fields.pluginVersion +
    fields.orderId +
    fields.apiKey
  )
}

/** Sign a dataString with our RSA private key (SHA-256), base64-encoded. */
export function signDataString(dataString: string, privateKeyPem: string): string {
  const pem = normalizePem(privateKeyPem)
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(dataString)
  signer.end()
  return signer.sign(pem, "base64")
}

/**
 * Verify a signature against a dataString using Koko's PUBLIC key.
 * Used to validate the _responseUrl webhook actually came from Koko.
 */
export function verifySignature(
  dataString: string,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const pem = normalizePem(publicKeyPem)
    const verifier = crypto.createVerify("RSA-SHA256")
    verifier.update(dataString)
    verifier.end()
    return verifier.verify(pem, signatureBase64, "base64")
  } catch (e) {
    return false
  }
}
