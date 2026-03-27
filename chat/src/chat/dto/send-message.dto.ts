import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '안녕하세요!', description: '메시지 내용 (최대 1000자)' })
  content: string;
}
