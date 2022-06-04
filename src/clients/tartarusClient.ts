// Client for tartarus service
// DTOs/models should be shared between service and client

import { Stream } from 'stream'

export interface IChannelClosedListener {
  (channel: number): Promise<void>
}

export interface IChannelOpenedListener {
  (channel: number, stream: Stream): Promise<void>
}

export class TartarusError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'TartarusError'
  }
}
export interface ITartarusErrorListener {
  (error: TartarusError): Promise<void>
}

export interface ITartarusChannel {
  id: number
  stream: Stream
}

export interface ITartarusStatistics {
  averageLatencyMs: number
  maxLatencyMs: number
  totalRequests: number
  sessionLifeTimeMs: number
  totalErrorCount: number
  totalSocketReconnectCount: number
  averagePayloadSizeBytes: number
}

export interface ITartarusClient {
  getActiveChannels(): Promise<ITartarusChannel[]>
  getStatistics(): Promise<ITartarusStatistics>
  connect(): Promise<void>
  close (): Promise<void>
  isConnected (): Promise<boolean>
  openChannel (): Promise<Stream>
  closeChannel (channel: number): Promise<void>
  onChannelClosed (listener: IChannelClosedListener): void
  onChannelOpened (listener: IChannelOpenedListener): void
  onError (listener: ITartarusErrorListener): void
}

// Client is leveraged in CLI tool
export class TartarusClient implements ITartarusClient {
  private readonly apiUrl: string

  constructor (apiUrl: string) {
    this.apiUrl = apiUrl
  }

  getActiveChannels (): Promise<ITartarusChannel[]> {
    throw new Error('Method not implemented.')
  }

  getStatistics (): Promise<ITartarusStatistics> {
    throw new Error('Method not implemented.')
  }

  connect (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  close (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  isConnected (): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  openChannel (): Promise<Stream> {
    throw new Error('Method not implemented.')
  }

  closeChannel (channel: number): Promise<void> {
    throw new Error('Method not implemented.')
  }

  onChannelClosed (listener: IChannelClosedListener): void {
    throw new Error('Method not implemented.')
  }

  onChannelOpened (listener: IChannelOpenedListener): void {
    throw new Error('Method not implemented.')
  }

  onError (listener: ITartarusErrorListener): void {
    throw new Error('Method not implemented.')
  }
}
