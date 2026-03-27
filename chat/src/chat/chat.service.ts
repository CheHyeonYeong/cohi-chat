import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { RoomMember } from './entities/room-member.entity';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';

// Spring의 @Service에 대응 — 비즈니스 로직 담당
@Injectable()
export class ChatService {
  constructor(
    // Spring의 @Autowired JpaRepository에 대응
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
  ) {}

  async getMessages(
    roomId: string,
    userId: string,
    cursor: string | undefined,
    size: number,
  ): Promise<MessagePageResponse> {
    // 권한 체크: JWT userId가 해당 roomId의 RoomMember인지 확인
    // Spring의 @PreAuthorize 대신 서비스 레이어에서 직접 검증
    const member = await this.roomMemberRepository.findOne({
      where: {
        roomId,
        memberId: userId,
        deletedAt: IsNull(), // soft delete된 멤버 제외
      },
    });

    if (!member) {
      // 방 자체가 없을 수도 있고 멤버가 아닐 수도 있음
      // 방 존재 여부를 노출하지 않기 위해 통일된 에러 사용
      throw new NotFoundException('채팅방을 찾을 수 없거나 접근 권한이 없습니다.');
    }

    // 커서 기반 페이징: cursor(ISO timestamp) 이전의 메시지를 created_at DESC로 조회
    // Spring Pageable과 달리 TypeORM은 where 조건 + take로 구현
    const messages = await this.messageRepository.find({
      where: {
        roomId,
        ...(cursor ? { createdAt: LessThan(new Date(cursor)) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: size,
    });

    // size만큼 정확히 왔으면 다음 페이지가 있을 수 있음 — 마지막 항목의 createdAt을 커서로
    const nextCursor =
      messages.length === size
        ? messages[messages.length - 1].createdAt.toISOString()
        : null;

    return {
      messages: messages.map(MessageDto.from),
      nextCursor,
    };
  }
}
