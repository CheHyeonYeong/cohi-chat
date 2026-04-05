import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from '../chat.constants';

export class SendMessageDto {
  @ApiProperty({
    example: 'hello',
    description: `Message content. It is trimmed before persistence and limited to ${MESSAGE_MAX_LENGTH} characters.`,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MESSAGE_MAX_LENGTH)
  content!: string;
}
