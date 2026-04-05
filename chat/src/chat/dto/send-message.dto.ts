import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'hello',
    description:
      'Message content. It is trimmed before persistence and limited to 1000 characters.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}
