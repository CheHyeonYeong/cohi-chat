import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MESSAGE_MAX_LENGTH } from '../message.constants';

export class SendMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Message content cannot be blank.' })
  @MaxLength(MESSAGE_MAX_LENGTH, {
    message: `Message content cannot exceed ${MESSAGE_MAX_LENGTH} characters.`,
  })
  @ApiProperty({
    example: 'hello',
    description:
      'Message content. It is trimmed before validation and limited to 1000 characters.',
  })
  content: string;
}
