import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    example: 'hello',
    description:
      'Message content. It is trimmed before persistence and limited to 1000 characters.',
  })
  content: string;
}
