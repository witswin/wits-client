import { describe, it, expect } from 'bun:test'
import { createClientAPI } from '../dist'

describe('Main App TestCase', () => {
  it('Should be true', () => {
    expect(true).toBe(true)
  })
})

describe('Client API', () => {
  const clientApi = createClientAPI({
    appId: 'test-case'
  })

  it('should be able to ping the api', async () => {
    const { data, error } = await clientApi.GET('/stats/total/', {})

    expect(data).not.toBe(null)
    expect(error).toBeEmpty()
  })
})
