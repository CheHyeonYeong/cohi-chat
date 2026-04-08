export abstract class ChatRoomActivityNotifier {
  abstract notifyRoomActivity(roomId: string): void;
}
