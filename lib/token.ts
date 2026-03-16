import crypto from 'crypto'

const ENC_KEY = (process.env.LINK_ENC_KEY || '').trim() // hex 32 bytes
const HMAC_KEY = (process.env.LINK_HMAC_KEY || '').trim() // any secret

function assertKeys() {
  if (!ENC_KEY || ENC_KEY.length !== 64) {
    throw new Error('LINK_ENC_KEY must be a 32-byte hex string (64 hex chars)')
  }
  if (!HMAC_KEY) {
    throw new Error('LINK_HMAC_KEY is required')
  }
}

export function sealUrl(url: string, ttlSec = 600): string {
  assertKeys()
  const payload = JSON.stringify({ url, exp: Math.floor(Date.now() / 1000) + ttlSec })
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'hex'), iv)
  const enc = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const blob = Buffer.concat([iv, tag, enc]).toString('base64url')
  const sig = crypto.createHmac('sha256', HMAC_KEY).update(blob).digest('base64url')
  return `${blob}.${sig}`
}

export function openUrlFromToken(token: string): string {
  assertKeys()
  const parts = token.split('.')
  if (parts.length !== 2) throw new Error('invalid token')
  const [blob, sig] = parts
  const expected = crypto.createHmac('sha256', HMAC_KEY).update(blob).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('bad signature')
  }
  const raw = Buffer.from(blob, 'base64url')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const enc = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'hex'), iv)
  decipher.setAuthTag(tag)
  const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  const { url, exp } = JSON.parse(json)
  if (!url || !exp || Math.floor(Date.now() / 1000) > exp) {
    throw new Error('expired token')
  }
  return url as string
}


