import { witsWSUrl } from '../config'
import {
  QuizEntryMessageType,
  WebSocketClient,
  type WebSocketOptions
} from './client'
import type { components } from '../api-dashboard'

export type MessageHandler = (args: MessageData) => void

export type HintDataType = Record<number, number> | number[]

export type MessageData =
  | {
      type: QuizEntryMessageType.NEW_QUESTION
      question: QuestionWithoutIsCorrect
    }
  | {
      type: QuizEntryMessageType.HINT_QUESTION
      data: HintDataType
      questionId: number
      hintType: HINTS
      hintId: number
    }
  | {
      type: QuizEntryMessageType.QUIZ_STATS
      data: QuizStatsData
    }
  | {
      type: Exclude<
        QuizEntryMessageType,
        | QuizEntryMessageType.NEW_QUESTION
        | QuizEntryMessageType.HINT_QUESTION
        | QuizEntryMessageType.QUIZ_STATS
      >
      data: unknown
    }

type QuestionWithoutIsCorrect = Omit<
  components['schemas']['QuestionSchema'],
  'choices'
> & {
  choices: Omit<
    components['schemas']['QuestionSchema']['choices'][number],
    'isCorrect'
  >[]
}

export enum HINTS {
  'fifty' = 'fifty',
  'stats' = 'stats',
  'time' = 'time'
}

export interface QuizStatsData {
  usersParticipating: number
  prizeToWin: number
  lives: number
  totalParticipantsCount: number
  hintCount: number
  previousRoundLosses: number
  totalSpectatorsCount: number
}

export class QuizWebSocketHandler {
  public wsClient: WebSocketClient

  private handlers = new Map<QuizEntryMessageType, MessageHandler[]>()

  constructor(
    wsOptions: Omit<WebSocketOptions, 'url' | 'onMessage'>,
    quiz: Omit<
      components['schemas']['CompetitionWithResourceSchema'],
      'resources'
    >,
    jwtToken?: string
  ) {
    this.wsClient = new WebSocketClient({
      ...wsOptions,
      url: `${witsWSUrl}/ws/quiz/${quiz.id}/`,
      onMessage: data => this.handleMessage(data.toString()),
      jwtToken
    })
  }

  public on(type: QuizEntryMessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  public off(type: QuizEntryMessageType, handler: MessageHandler) {
    if (!this.handlers.has(type)) return

    this.handlers.set(
      type,
      this.handlers.get(type)!.filter(item => item !== handler)
    )
  }

  public requestHint({
    hintId,
    hintType,
    questionId
  }: {
    questionId: number
    hintType: HINTS
    hintId: number
  }) {
    this.wsClient.sendJSONMessage({
      command: 'GET_HINT',
      args: {
        hintId: hintId.toString(),
        hintType,
        questionId
      }
    })
  }

  public sendSelectAnswer({
    questionId,
    selectedChoiceId
  }: {
    questionId: number
    selectedChoiceId: number
  }) {
    this.wsClient.sendJSONMessage({
      command: 'ANSWER',
      args: {
        questionId,
        selectedChoiceId
      }
    })
  }

  public onHint(
    callback: (data: {
      data: HintDataType
      hintType: HINTS
      questionId: number
      hintId: number
    }) => void
  ) {
    this.on(QuizEntryMessageType.HINT_QUESTION, callback as MessageHandler)
  }

  public offHint(
    callback: (data: {
      data: HintDataType
      hintType: HINTS
      questionId: number
      hintId: number
    }) => void
  ) {
    this.off(QuizEntryMessageType.HINT_QUESTION, callback as MessageHandler)
  }

  public onPingUpdate(callback: () => void) {
    this.on(QuizEntryMessageType.PONG, callback as MessageHandler)
  }

  public offPingUpdate(callback: () => void) {
    this.off(QuizEntryMessageType.PONG, callback as MessageHandler)
  }

  public onQuizStats(callback: (data: { data: QuizStatsData }) => void) {
    this.on(QuizEntryMessageType.QUIZ_STATS, callback as MessageHandler)
  }

  public offQuizStats(callback: (data: { data: QuizStatsData }) => void) {
    this.off(QuizEntryMessageType.QUIZ_STATS, callback as MessageHandler)
  }

  public onNewQuestion(
    callback: (data: { question: QuestionWithoutIsCorrect }) => void
  ) {
    this.on(QuizEntryMessageType.NEW_QUESTION, callback as MessageHandler)
  }

  public offNewQuestion(
    callback: (data: { question: QuestionWithoutIsCorrect }) => void
  ) {
    this.off(QuizEntryMessageType.NEW_QUESTION, callback as MessageHandler)
  }

  public onCorrectAnswerBroadcast(
    callback: (res: {
      data: {
        questionId: number
        answerId: number
        questionNumber: number
        expire: number
      }
    }) => void
  ) {
    this.on(QuizEntryMessageType.CORRECT_ANSWER, callback as MessageHandler)
  }

  public offCorrectAnswerBroadcast(
    callback: (res: {
      data: {
        questionId: number
        answerId: number
        questionNumber: number
        expire: number
      }
    }) => void
  ) {
    this.off(QuizEntryMessageType.CORRECT_ANSWER, callback as MessageHandler)
  }

  public onQuizFinished(callback: () => void) {
    this.on(QuizEntryMessageType.QUIZ_FINISHED, callback as MessageHandler)
  }

  public offQuizFinished(callback: () => void) {
    this.off(QuizEntryMessageType.QUIZ_FINISHED, callback as MessageHandler)
  }

  private handleMessage(data: string): void {
    if (data === QuizEntryMessageType.PONG) {
      return
    }

    let parsedData: MessageData
    try {
      parsedData = JSON.parse(data)
    } catch (error) {
      console.warn('Invalid WebSocket message:', error)
      return
    }

    const handler = this.handlers.get(parsedData.type)
    if (handler) {
      handler.forEach(fn => {
        fn(parsedData)
      })
      return
    }
  }

  public isConnected(): boolean {
    return this.wsClient.getStatus().isConnected
  }

  public disconnect(): void {
    this.wsClient.disconnect()
  }
}
