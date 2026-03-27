import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Spring의 @Entity + @Table(name = "chat_room") 에 대응
@Entity('chat_room')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  type: string; // ONE_TO_ONE | GROUP

  @Column({ length: 20 })
  status: string; // ACTIVE | INACTIVE

  @Column({ name: 'external_ref_type', length: 50 })
  externalRefType: string; // RESERVATION 등

  @Column({ name: 'external_ref_id', type: 'uuid' })
  externalRefId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // @DeleteDateColumn → find* 쿼리에서 자동으로 WHERE deleted_at IS NULL 추가
  // Spring의 @SQLDelete + @Where 조합과 동일한 효과
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
