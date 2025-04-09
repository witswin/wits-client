export class APIError extends Error {
  public readonly status: number
  public readonly details: any

  constructor(status: number, message: string, details?: any) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.details = details
  }

  static async fromResponse(res: Response): Promise<APIError> {
    let message = `HTTP ${res.status}`
    let details = null

    try {
      const json: any = await res.json()
      message = json.message || message
      details = json
    } catch {
      message = await res.text()
    }

    return new APIError(res.status, message, details)
  }
}
