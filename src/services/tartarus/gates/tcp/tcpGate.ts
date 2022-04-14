import { ITCPGateConfig } from '../../../../config/gateConfig'
import { IGate } from '../gate'
import { createServer, Server, Socket } from 'net'
import COMPUTED_CONSTANTS from '../../../../common/computedConstants'
import createLogger from '../../../../common/logger/factory'
import { IClientSession, IClientSessionBuilder } from './tcpClientSession'

/**
 * Requirements:
 * - Must support communication over a secure TLS stream
 * - Must support mTLS authentication
 * - Must support token based authentication
 * - Must support plaintext for debugging purposes
 * - Must support channels inside of a single socket to reduce connection overhead
 * - Must support a heartbeat mechanism to detect dead connections (server pings, client responds with pongs), auto negotiated at session start
 * - Must support delivery from the server to the client
 *
 * Core message properties needed to achieved this that must included in message headers:
 * - header version (2 bytes)
 * - length in bytes of message body (unsigned 8 bytes)
 * - channel id (0-255) (1 byte) (0 = control channel)
 * - sequence number (2 byte) incrementing on each message, scoped to channel
 * - message type (2 bytes)
 * - message timestamp (8 bytes) unix timestamp in milliseconds
 * - message body crc32 (4 bytes)
 * .....
 * - message body (variable length)
 *
 * Message types:
 * - 0x0000 - ping
 * - 0x0001 - pong
 * - 0x0002 - authentication
 * - 0x0003 - authentication success
 * - 0x0004 - authentication failure
 * - 0x0005 - client message
 * - 0x0006 - server message
 * - 0x0007 - client message ack
 * - 0x0008 - server message ack
 * - 0x0009 - client message nack
 * - 0x000A - server message nack
 * - 0x000B - channel open
 * - 0x000C - channel open success
 * - 0x000D - channel open failure
 * - 0x000E - channel close
 * - 0x000F - channel close success
 * - 0x0010 - channel close failure
 * - 0x0011 - session open
 * - 0x0012 - session open success
 * - 0x0013 - session open failure
 * - 0x0014 - session close
 * - 0x0015 - session close success
 * - 0x0016 - session close failure
 * - 0x0017 - crc32 error
 *
 * Messages with no body:
 * - 0x0000 - ping
 * - 0x0001 - pong
 * - 0x0005 - client message ack
 * - 0x0006 - server message ack
 *
 * General purpose:
 * The TcpGate provides a custom protocol on top of TCP to tunnel connections between two parties effeciently and securely.
 * Tartarus clients can pick the gate that best suits their needs to do the following things:
 * - Create a local pipe that can be written to and read from by other processes on the same machine that is tunneled into hermes through tartarus.
 * - Create a local socket server that can be written to and read from by anything with access with comms tunneled into hermes through tartarus.
 * - Connect to a local socket server managed by another process or network as client, this stream is tunneled into hermes through tartarus.
 * - Connect to a local serial port and tunnel comms into hermes through tartarus.
 * - Listen on a UDP port and tunnel comms into hermes through tartarus forwarding anything received on the port to the local port to hermes.
 * - etc... The intent of tartarus is to provide a bridge between hermes and datasources that would not otherwise be accessible to hermes.
 *
 * Responsibilities:
 * - Create and maintain socket server to accept new connections
 * - Maintain connection list of all connections so they can be cleaned up
 * - Gracefully close all connections when stopped/closed
 * - Create and maintain publisher connection for distributed bus (limit bus connections)
 * - Create and maintain subscriber connection for distributed bus (limit bus connections)
 */
export class TcpGate implements IGate {
  private readonly host: string
  private readonly port: number
  private socketServer?: Server
  private sessionBuilder: IClientSessionBuilder
  private readonly clientSessions: IClientSession[] = []

  private readonly log = createLogger({
    serviceName: `tartarus-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (config: ITCPGateConfig, sessionBuilder: IClientSessionBuilder) {
    this.host = config.host
    this.port = config.port
    this.sessionBuilder = sessionBuilder
  }

  open (): Promise<void> {
    this.socketServer = createServer({}, this.onConnection.bind(this))
    return Promise.resolve()
  }

  async close (): Promise<void> {
    await Promise.all(this.clientSessions.map((s) => {
      return s.end()
    }))
    return new Promise((resolve, reject) => {
      this.socketServer?.close((err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }

  private async onConnection (socket: Socket) : Promise<void> {
    this.log.info(`New connection from ${socket.remoteAddress}`)
    try {
      const newSession = await this.completeHandshake(socket)
      this.clientSessions.push(newSession)
      this.log.info(`Completed handshake for ${socket.remoteAddress}`)
    } catch (e) {
      this.log.error('Error completing handshake for new session', e)
    }
  }

  private async completeHandshake (socket: Socket) : Promise<IClientSession> {
    const session = await this.sessionBuilder.build(socket)
    await session.authenticate()
    this.log.info(`Authenticated session for ${socket.remoteAddress}`)
    return session
  }
}
