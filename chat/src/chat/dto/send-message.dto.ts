// Spring의 @RequestBody DTO에 대응
// class-validator 없이 서비스 레이어에서 직접 검증
export class SendMessageDto {
  content: string;
}
