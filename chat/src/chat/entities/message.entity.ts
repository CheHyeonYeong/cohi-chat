import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
  messageType: string; // TEXT | RESERVATION_CARD | SYSTEM

  @Column({ type: 'varchar', length: 2000, nullable: true })
  content: string | null;

  // JSONB — RESERVATION_CARD: 예약 snapshot / SYSTEM: 메타데이터
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  // message는 불변 — updated_at, deleted_at 없음
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
