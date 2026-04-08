import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatPollRegistry,
  type PollWaitSubscription,
} from './chat-poll-registry';
import {
  PollMessageResponse,
  PollMessagesCommand,
} from './dto/poll-messages.dto';

interface PollingMessageRecord {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
}

export const MAX_POLL_TIMEOUT_SECONDS = 25;
export const POLL_TIMEOUT_BUFFER_SECONDS = 10;
export const RECOMMENDED_POLL_REQUEST_TIMEOUT_SECONDS =
  MAX_POLL_TIMEOUT_SECONDS + POLL_TIMEOUT_BUFFER_SECONDS;
export const MAX_POLL_MESSAGES = 100;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollRegistry: ChatPollRegistry,
  ) {}

  // Send-message owner branches should call this after the message commit succeeds.
  notifyRoomActivity(roomId: string): void {
    this.pollRegistry.notifyRoom(roomId);
  }

  async pollMessages({
    roomId,
    sinceMessageId,
    timeoutSeconds,
    username,
    abortSignal,
  }: PollMessagesCommand): Promise<PollMessageResponse[]> {
    this.validateTimeout(timeoutSeconds);

    const memberId = await this.resolveMemberId(username);
    await this.getAccessibleMembership(roomId, memberId);

    const pollingStartedAt = new Date();
    const subscription =
      timeoutSeconds === 0
        ? undefined
        : this.pollRegistry.createRoomSubscription(
            roomId,
            timeoutSeconds * 1000,
            abortSignal,
          );

    try {
      const messages = await this.findMessagesAfter(
        roomId,
        sinceMessageId,
        pollingStartedAt,
      );
      if (messages.length > 0 || timeoutSeconds === 0) {
        return messages.map((message) => this.toPollMessageResponse(message));
      }

      const waitResult = await this.waitForMessages(subscription);
      if (waitResult !== 'notified') {
        return [];
      }

      const waitedMessages = await this.findMessagesAfter(
        roomId,
        sinceMessageId,
        pollingStartedAt,
      );

      return waitedMessages.map((message) =>
        this.toPollMessageResponse(message),
      );
    } finally {
      subscription?.cancel();
    }
  }

  private async resolveMemberId(username: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: {
        username,
        isDeleted: false,
        isBanned: false,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException('The authenticated user does not exist.');
    }

    return member.id;
  }

  private async getAccessibleMembership(
    roomId: string,
    memberId: string,
  ): Promise<void> {
    const roomMember = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }

    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        isDisabled: false,
      },
      select: {
        id: true,
      },
    });

    if (!room) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }
  }

  private validateTimeout(timeoutSeconds: number): void {
    if (
      !Number.isInteger(timeoutSeconds) ||
      timeoutSeconds < 0 ||
      timeoutSeconds > MAX_POLL_TIMEOUT_SECONDS
    ) {
      throw new BadRequestException(
        `timeout must be an integer between 0 and ${MAX_POLL_TIMEOUT_SECONDS}.`,
      );
    }
  }

  private async findMessagesAfter(
    roomId: string,
    sinceMessageId: string | undefined,
    pollingStartedAt: Date,
  ): Promise<PollingMessageRecord[]> {
    if (!sinceMessageId) {
      return this.prisma.message.findMany({
        where: {
          roomId,
          createdAt: {
            gt: pollingStartedAt,
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: MAX_POLL_MESSAGES,
      });
    }

    const anchorMessage = await this.findRoomMessageAnchor(roomId, sinceMessageId);

    return this.prisma.message.findMany({
      where: {
        roomId,
        OR: [
          {
            createdAt: {
              gt: anchorMessage.createdAt,
            },
          },
          {
            createdAt: anchorMessage.createdAt,
            id: {
              gt: anchorMessage.id,
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_POLL_MESSAGES,
    });
  }

  private async findRoomMessageAnchor(
    roomId: string,
    messageId: string,
  ): Promise<Pick<PollingMessageRecord, 'id' | 'createdAt'>> {
    const anchorMessage = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        roomId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!anchorMessage) {
      throw new BadRequestException(
        'The message cursor does not belong to the specified room.',
      );
    }

    return anchorMessage;
  }

  private waitForMessages(
    subscription: PollWaitSubscription | undefined,
  ): Promise<'notified' | 'timed_out' | 'aborted'> {
    if (!subscription) {
      return Promise.resolve('timed_out');
    }

    return subscription.completion;
  }

  private toPollMessageResponse(
    message: PollingMessageRecord,
  ): PollMessageResponse {
    return {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      messageType: message.messageType,
      content: message.content,
      payload: message.payload,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
