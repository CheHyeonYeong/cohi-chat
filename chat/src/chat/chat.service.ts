import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendMessageDto } from './dto/send-message.dto';
import { Message } from './entities/message.entity';
import { RoomMember } from './entities/room-member.entity';

// Spring의 @Service에 대응
@Injectable()
export class ChatService {
  constructor(
    // Spring의 @Autowired JpaRepository에 대응
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
  ) {}

  async sendMessage(
    roomId: string,
    userId: string,
    dto: SendMessageDto,
  ): Promise<Message> {
    this.validateContent(dto.content);

    // 권한 체크: JWT userId가 해당 방의 RoomMember인지 확인
    // @DeleteDateColumn 덕분에 soft-delete된 레코드는 자동 제외됨
    const roomMember = await this.roomMemberRepository.findOne({
      where: { roomId, memberId: userId },
    });

    if (!roomMember) {
      throw new ForbiddenException('해당 채팅방에 접근 권한이 없습니다.');
    }

    // 메시지 저장
    const message = this.messageRepository.create({
      roomId,
      senderId: userId,
      messageType: 'TEXT',
      content: dto.content,
    });
    const savedMessage = await this.messageRepository.save(message);

    // sender의 last_read_message_id 갱신 — 본인이 보낸 메시지는 읽은 것으로 처리
    await this.roomMemberRepository.update(roomMember.id, {
      lastReadMessageId: savedMessage.id,
    });

    return savedMessage;
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
}
