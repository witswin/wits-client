import crypto from 'crypto'
import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from '../api-dashboard'
import { witsApiUrl } from '../config'

const generateNonce = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

const parsePrivateKey = (privateKey: string) => {
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
}

export async function signMessage(privateKey: string, message: string) {
  const key = await parsePrivateKey(privateKey)
  const encoded = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoded)

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export const createDashboardAPI = ({
  appId,
  privateKey
}: {
  privateKey: string
  appId: string
}) => {
  const client = createClient<paths>({ baseUrl: witsApiUrl })

  const privateKeySignAuthenticationMiddleware: Middleware = {
    async onRequest({ request }) {
      const timestamp = new Date().getTime() / 1000
      const nonce = generateNonce()
      const url = new URL(request.url)
      const path = url.pathname + url.search
      const message = `${timestamp}:${appId}:${nonce}:${path}`
      const signature = await signMessage(privateKey, message)

      request.headers.set('X-APP-ID', appId)
      request.headers.set('X-NONCE', nonce)
      request.headers.set('X-TIMESTAMP', timestamp.toString())
      request.headers.set('X-SIGNATURE', signature)

      return request
    }
  }

  client.use(privateKeySignAuthenticationMiddleware)

  return client
}
