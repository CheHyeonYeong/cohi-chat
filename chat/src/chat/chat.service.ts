import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';

const MESSAGE_MAX_LENGTH = 1000;

type MessageRow = {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: unknown;
  createdAt: Date;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(
    roomId: string,
    username: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    const normalizedContent = this.normalizeContent(dto.content);
    const memberId = await this.resolveMemberId(username);

    const roomMember = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!roomMember) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }

    const savedMessage = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          roomId,
          senderId: memberId,
          messageType: 'TEXT',
          content: normalizedContent,
        },
      });

      await tx.roomMember.update({
        where: { id: roomMember.id },
        data: { lastReadMessageId: message.id },
      });

      return message;
    });

    return MessageDto.from(savedMessage);
  }

  async getMessages(
    roomId: string,
    username: string,
    cursor: Date | undefined,
    size: number,
  ): Promise<MessagePageResponse> {
    const memberId = await this.resolveMemberId(username);

    const member = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!member) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }

    const rows = await this.fetchMessagesPage(roomId, cursor, size);
    return {
      messages: rows.messages.map((message) => MessageDto.from(message)),
      nextCursor: rows.nextCursor,
    };
  }

  private async resolveMemberId(username: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: {
        username,
        isDeleted: false,
        isBanned: false,
      },
      select: { id: true },
    });

    if (!member) {
      throw new UnauthorizedException('The authenticated user does not exist.');
    }

    return member.id;
  }

  private normalizeContent(content: unknown): string {
    if (typeof content !== 'string') {
      throw new BadRequestException('Message content must be a string.');
    }

    const normalizedContent = content.trim();

    if (normalizedContent.length === 0) {
      throw new BadRequestException('Message content cannot be blank.');
    }

    if (normalizedContent.length > MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(
        `Message content cannot exceed ${MESSAGE_MAX_LENGTH} characters.`,
      );
    }

    return normalizedContent;
  }

  private async fetchMessagesPage(
    roomId: string,
    cursor: Date | undefined,
    size: number,
  ): Promise<{ messages: MessageRow[]; nextCursor: string | null }> {
    const rows = await this.fetchMessagesBatch(roomId, cursor, size + 1);

    if (rows.length <= size) {
      return { messages: rows, nextCursor: null };
    }

    const boundaryTime = rows[size - 1].createdAt;
    let extendedRows = rows;
    let firstOlderIndex = extendedRows.findIndex(
      (row) => row.createdAt.getTime() < boundaryTime.getTime(),
    );

    while (firstOlderIndex === -1) {
      const lastRow = extendedRows[extendedRows.length - 1];
      const nextBatch = await this.fetchMessagesBatch(
        roomId,
        cursor,
        size + 1,
        lastRow,
      );

      if (nextBatch.length === 0) {
        return { messages: extendedRows, nextCursor: null };
      }

      extendedRows = [...extendedRows, ...nextBatch];
      firstOlderIndex = extendedRows.findIndex(
        (row) => row.createdAt.getTime() < boundaryTime.getTime(),
      );
    }

    return {
      messages: extendedRows.slice(0, firstOlderIndex),
      nextCursor: boundaryTime.toISOString(),
    };
  }

  private async fetchMessagesBatch(
    roomId: string,
    cursor: Date | undefined,
    take: number,
    after?: { createdAt: Date; id: string },
  ): Promise<MessageRow[]> {
    return this.prisma.message.findMany({
      where: {
        roomId,
        ...(cursor ? { createdAt: { lt: cursor } } : {}),
        ...(after
          ? {
              OR: [
                { createdAt: { lt: after.createdAt } },
                {
                  createdAt: after.createdAt,
                  id: { lt: after.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }
}
