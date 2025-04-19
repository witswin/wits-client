// Define a generic Data type for messages
export type WebSocketData = string | object | ArrayBuffer | Blob

// Interface for WebSocketOptions
export interface WebSocketOptions {
  url: string
  reconnect?: boolean
  pingInterval?: number // in milliseconds
  jwtToken?: string
  onOpen?: () => void
  onMessage?: (data: WebSocketData) => void
  onError?: (error: Event | Error) => void // Support both browser and Node.js error types
  onClose?: (event: CloseEvent | { code?: number; reason?: string }) => void // Support both browser and Node.js close events
}

export enum QuizEntryMessageType {
  PONG = 'PONG',
  NEW_QUESTION = 'new_question',
  CORRECT_ANSWER = 'correct_answer',
  QUIZ_STATS = 'quiz_stats',
  QUIZ_FINISHED = 'quiz_finished',
  HINT_QUESTION = 'hint_question'
}

export interface WebSocketStatus {
  ping: number
  isConnected: boolean
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnect: boolean
  private pingInterval: number
  private pingTimer: ReturnType<typeof setInterval> | null = null // Use generic timer type
  private lastPing: Date | null = null
  private status: WebSocketStatus = { ping: 0, isConnected: false }

  // Callbacks
  private onOpenCallback?: () => void
  private onMessageCallback?: (data: WebSocketData) => void
  private onErrorCallback?: (error: Event | Error) => void
  private onCloseCallback?: (
    event: CloseEvent | { code?: number; reason?: string }
  ) => void

  constructor(options: WebSocketOptions) {
    this.url = options.url

    if (options.jwtToken) {
      this.url += `?auth=${encodeURIComponent(options.jwtToken)}`
    }

    this.reconnect = options.reconnect ?? true
    this.pingInterval = options.pingInterval ?? 3000
    this.onOpenCallback = options.onOpen
    this.onMessageCallback = options.onMessage
    this.onErrorCallback = options.onError
    this.onCloseCallback = options.onClose

    this.connect()
  }

  // Public method to connect or reconnect
  public connect(): void {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.url)
    this.status.isConnected = false

    this.ws.onopen = () => {
      console.log('WebSocket connection established.')
      this.status.isConnected = true
      this.lastPing = new Date()
      this.startPing()
      this.onOpenCallback?.()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      let data: WebSocketData = event.data

      // Handle JSON messages
      if (typeof data === 'string') {
        try {
          if (data === QuizEntryMessageType.PONG) {
            const now = new Date()
            const timePassed = this.lastPing
              ? now.getTime() - this.lastPing.getTime()
              : -1
            this.status.ping = timePassed
            this.lastPing = now
          } else if (data.startsWith('{') || data.startsWith('[')) {
            // Attempt to parse JSON
            data = JSON.parse(data)
          }
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', error)
        }
      }

      this.onMessageCallback?.(data)
    }

    this.ws.onerror = (error: Event | Error) => {
      console.warn('WebSocket error:', error)
      this.status.isConnected = false
      this.onErrorCallback?.(error)
    }

    this.ws.onclose = (
      event: CloseEvent | { code?: number; reason?: string }
    ) => {
      console.log('WebSocket closed:', event)
      this.status.isConnected = false
      this.stopPing()
      this.onCloseCallback?.(event)

      if (this.reconnect) {
        setTimeout(() => this.connect(), 1000) // Reconnect after delay
      }
    }
  }

  // Send a message
  public sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    } else {
      console.warn('WebSocket is not connected.')
    }
  }

  // Send a JSON-serializable message
  public sendJSONMessage(message: unknown): void {
    try {
      const serialized = JSON.stringify(message)
      this.sendMessage(serialized)
    } catch (error) {
      console.warn('Failed to serialize JSON message:', error)
    }
  }

  // Get current status (ping, connection state)
  public getStatus(): WebSocketStatus {
    return { ...this.status }
  }

  // Close the connection manually
  public disconnect(): void {
    if (this.ws) {
      this.reconnect = false // Prevent reconnection
      this.ws.close()
      this.stopPing()
    }
  }

  // Private method to handle ping/pong
  private startPing(): void {
    this.stopPing() // Clear any existing timer
    this.sendJSONMessage({ command: 'PING' })
    this.pingTimer = setInterval(() => {
      try {
        this.lastPing = new Date()
        this.sendJSONMessage({ command: 'PING' })
      } catch (error) {
        console.warn('Ping error:', error)
        this.stopPing()
      }
    }, this.pingInterval)
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}
