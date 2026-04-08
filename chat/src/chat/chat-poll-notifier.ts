import { Injectable } from '@nestjs/common';
import { ChatPollRegistry } from './chat-poll-registry';
import { ChatRoomActivityNotifier } from './chat-room-activity-notifier';

@Injectable()
export class ChatPollNotifier extends ChatRoomActivityNotifier {
  // Message-write owner branches should call this after the DB commit succeeds.
  override
  notifyRoomActivity(roomId: string): void {
    this.pollRegistry.notifyRoom(roomId);
  }

  constructor(private readonly pollRegistry: ChatPollRegistry) {
    super();
  }
}
