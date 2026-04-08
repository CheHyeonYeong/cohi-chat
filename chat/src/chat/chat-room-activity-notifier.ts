import { Injectable } from '@nestjs/common';

export abstract class ChatRoomActivityNotifier {
  abstract notifyRoomActivity(roomId: string): void | Promise<void>;
}

@Injectable()
export class NoopChatRoomActivityNotifier extends ChatRoomActivityNotifier {
  override notifyRoomActivity(_roomId: string): void {
    // Default no-op notifier. Poll transport branches can override this provider.
  }
}
