import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(
    roomId: string,
    username: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    this.validateContent(dto.content);

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
      throw new ForbiddenException('해당 채팅방에 접근 권한이 없습니다.');
    }

    const savedMessage = await this.prisma.message.create({
      data: {
        roomId,
        senderId: memberId,
        messageType: 'TEXT',
        content: dto.content.trim(),
      },
    });

    await this.prisma.roomMember.update({
      where: { id: roomMember.id },
      data: { lastReadMessageId: savedMessage.id },
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
      throw new ForbiddenException('해당 채팅방에 접근 권한이 없습니다.');
    }

    const rows = await this.fetchMessagesPage(roomId, cursor, size);
    return {
      messages: rows.messages.map(MessageDto.from),
      nextCursor: rows.nextCursor,
    };
  }

  // Spring JWT sub = username이므로 member 테이블에서 UUID 조회
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
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }
    return member.id;
  }

  private validateContent(content: unknown): void {
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new BadRequestException('메시지 내용은 공백일 수 없습니다.');
    }
    if (content.length > 1000) {
      throw new BadRequestException(
        '메시지는 최대 1000자까지 입력할 수 있습니다.',
      );
    }
  }

  private async fetchMessagesPage(
    roomId: string,
    cursor: Date | undefined,
    size: number,
  ): Promise<{ messages: Array<{ id: string; roomId: string; senderId: string | null; messageType: string; content: string | null; payload: unknown; createdAt: Date }>; nextCursor: string | null }> {
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
  ) {
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
