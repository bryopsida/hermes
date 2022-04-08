import { ITCPGateConfig } from '../../../../config/gateConfig'
import { IGate } from '../gate'
import { createServer, Server, Socket } from 'net'

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
  private socketServer: Server
  private readonly openSockets: Socket[] = []

  constructor (config: ITCPGateConfig) {
    this.host = config.host
    this.port = config.port
  }

  open (): Promise<void> {
    this.socketServer = createServer({}, this.onConnection.bind(this))
    return Promise.resolve()
  }

  close (): Promise<void> {
    this.openSockets.map((s) => {
      return new Promise((resolve, reject) => {
        s.end()
      })
    })
  }

  onConnection (socket: Socket) :void {

  }
}
