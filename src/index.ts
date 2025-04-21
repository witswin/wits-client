import type {
  paths as clientPaths,
  components as clientComponents
} from './api-client-v1'
import type {
  paths as clientV2Paths,
  components as clientV2Components
} from './api-client-v2'
import type {
  paths as dashboardPaths,
  components as dashboardComponents
} from './api-dashboard'

export * from './ws'
export * from './http'
export * from './config'
export * from './api-dashboard.d'

export type {
  clientPaths,
  clientV2Paths,
  dashboardPaths,
  clientComponents,
  clientV2Components,
  dashboardComponents
}
