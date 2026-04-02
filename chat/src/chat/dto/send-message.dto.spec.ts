import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

const validateDto = (content: unknown) => {
  const dto = plainToInstance(SendMessageDto, { content });
  return {
    dto,
    errors: validateSync(dto),
  };
};

describe('SendMessageDto', () => {
  it('trims valid content before validation', () => {
    const { dto, errors } = validateDto('  hello  ');

    expect(errors).toHaveLength(0);
    expect(dto.content).toBe('hello');
  });

  it('rejects blank content after trimming', () => {
    const { errors } = validateDto('   ');

    expect(errors).not.toHaveLength(0);
  });

  it('rejects content longer than 1000 characters', () => {
    const { errors } = validateDto('a'.repeat(1001));

    expect(errors).not.toHaveLength(0);
  });

  it('rejects non-string content', () => {
    const { errors } = validateDto(1234);

    expect(errors).not.toHaveLength(0);
  });
});