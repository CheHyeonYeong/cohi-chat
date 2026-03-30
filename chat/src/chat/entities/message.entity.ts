import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { MessageType } from '../enums/chat.enum';

// message는 불변 데이터 — updated_at, deleted_at 없음
@Entity('message')
@Index('idx_message_room_id_created_at', ['roomId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  // NULL이면 시스템 메시지
  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId: string | null;

  @Column({ name: 'message_type', length: 30 })
  messageType: MessageType;

  // 정책상 최대 1000자, DB 컬럼은 이모지 여유분 포함 2000자
  @Column({ type: 'varchar', length: 2000, nullable: true })
  content: string | null;

  // RESERVATION_CARD: 예약 snapshot / SYSTEM: 메타데이터
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
