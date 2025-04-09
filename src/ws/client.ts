import { WebSocket, type Data, type MessageEvent } from 'ws'

export interface WebSocketOptions {
  url: string
  reconnect?: boolean
  pingInterval?: number // in milliseconds
  jwtToken?: string
  onOpen?: () => void
  onMessage?: (data: Data) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
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
  private pingTimer: NodeJS.Timeout | null = null
  private lastPing: Date | null = null
  private status: WebSocketStatus = { ping: 0, isConnected: false }

  // Callbacks
  private onOpenCallback?: () => void
  private onMessageCallback?: (data: Data) => void
  private onErrorCallback?: (error: Event) => void
  private onCloseCallback?: (event: CloseEvent) => void

  constructor(options: WebSocketOptions) {
    this.url = options.url

    if (options.jwtToken) this.url += '?auth=' + options.jwtToken

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
      const data = event.data
      if (data === QuizEntryMessageType.PONG) {
        const now = new Date()
        const timePassed = this.lastPing
          ? now.getTime() - this.lastPing.getTime()
          : -1
        this.status.ping = timePassed
        this.lastPing = now
      }
      this.onMessageCallback?.(data)
    }

    this.ws.onerror = (error: Event) => {
      console.warn('WebSocket error:', error)
      this.status.isConnected = false
      this.onErrorCallback?.(error)
    }

    this.ws.onclose = (event: CloseEvent) => {
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

  public sendJSONMessage(message: unknown): void {
    return this.sendJSONMessage(JSON.stringify(message))
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
    this.sendMessage(JSON.stringify({ command: 'PING' }))
    this.pingTimer = setInterval(() => {
      try {
        this.lastPing = new Date()
        this.sendMessage(JSON.stringify({ command: 'PING' }))
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
