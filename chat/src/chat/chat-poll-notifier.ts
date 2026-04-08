import { Injectable } from '@nestjs/common';
import { ChatPollRegistry } from './chat-poll-registry';

@Injectable()
export class ChatPollNotifier {
  // Message-write owner branches should call this after the DB commit succeeds.
  notifyRoomActivity(roomId: string): void {
    this.pollRegistry.notifyRoom(roomId);
  }

  constructor(private readonly pollRegistry: ChatPollRegistry) {}
}
