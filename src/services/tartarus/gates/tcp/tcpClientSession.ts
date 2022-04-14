import { Socket } from 'net'

export interface ISessionPrincipal {
  clientId: string
}
export interface IClientSession {
  end(): Promise<void>
  authenticate(): Promise<ISessionPrincipal>
}

export interface IClientSessionBuilder {
  build(socket: Socket): Promise<IClientSession>
}

export class TcpClientSessionBuilder implements IClientSessionBuilder {
  build (socket: Socket): Promise<IClientSession> {
    throw new Error('Method not implemented.')
  }
}
