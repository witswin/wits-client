import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from '../api-client-v1'
import type { paths as v2Paths } from '../api-client-v2'
import { witsApiUrl } from '../config'

export const createClientAPI = ({
  appId,
  jwtToken
}: {
  jwtToken?: string
  appId?: string
}) => {
  const client = createClient<paths & v2Paths>({ baseUrl: witsApiUrl })

  const jwtAuthenticationMiddleware: Middleware = {
    async onRequest({ request }) {
      if (jwtToken) request.headers.set('Authorization', `Bearer ${jwtToken}`)
      if (appId) request.headers.set('X-APP-ID', appId)

      return request
    }
  }

  client.use(jwtAuthenticationMiddleware)

  return client
}
