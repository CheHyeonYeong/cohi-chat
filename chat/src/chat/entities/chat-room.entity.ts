import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Spring의 @Entity + @Table(name = "chat_room")에 대응
// 제거된 컬럼: type (멤버 수로 1:1 판단), status (is_disabled로 대체),
//              external_ref_type / external_ref_id (booking_id 직접 참조로 대체 예정)
@Entity('chat_room')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // soft delete flag — 30일 메시지 없으면 배치가 true로 설정
  // @DeleteDateColumn 대신 boolean flag 사용: 날짜보다 단순한 ON/OFF 의미가 명확함
  @Column({ name: 'is_disabled', type: 'boolean', default: false })
  isDisabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
