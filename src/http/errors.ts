export class APIError extends Error {
  public readonly status: number
  public readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.details = details
  }

  static async fromResponse(res: Response): Promise<APIError> {
    let message = `HTTP ${res.status}`
    let details = null

    try {
      const json = (await res.json()) as { message?: string }
      message = json.message || message
      details = json
    } catch {
      message = await res.text()
    }

    return new APIError(res.status, message, details)
  }
}
