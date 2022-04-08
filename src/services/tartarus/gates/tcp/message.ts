import { Writable } from 'stream'

export enum MessageType {
  Ping = 0x0000,
  Pong = 0x0001,
  Authentication = 0x0002,
  AuthenticationSuccess = 0x0003,
  AuthenticationFailure = 0x0004,
  ClientMessage = 0x0005,
  ServerMessage = 0x0006,
  ClientMessageAck = 0x0007,
  ServerMessageAck = 0x0008,
  ClientMessageNack = 0x0009,
  ServerMessageNack = 0x000A,
  ChannelOpen = 0x000B,
  ChannelOpenSuccess = 0x000C,
  ChannelOpenFailure = 0x000D,
  ChannelClose = 0x000E,
  ChannelCloseSuccess = 0x000F,
  ChannelCloseFailure = 0x0010,
  SessionOpen = 0x0011,
  SessionOpenSuccess = 0x0012,
  SessionOpenFailure = 0x0013,
  SessionClose = 0x0014,
  SessionCloseSuccess = 0x0015,
  SessionCloseFailure = 0x0016,
  Crc32Error = 0x0017
}

export interface IMessage {
  headerVersion: Uint8Array[2];
  length: Uint8Array[8];
  channelId: Uint8Array[1];
  sequenceNumber: Uint8Array[2];
  messageType: Uint8Array[2];
  messageTimestamp: Uint8Array[8];
  messageBodyCrc32: Uint8Array[4];
  messageBody: Uint8Array[];
  valid(): boolean;
  toBuffer(): Buffer;
  writeTo(stream: Writable): Promise<void>;
}
