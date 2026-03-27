// Spring의 @RequestParam DTO에 대응 — NestJS는 @Query()로 쿼리스트링을 받음
export class GetMessagesDto {
  // ISO 8601 타임스탬프 — 이 시각보다 이전 메시지를 가져옴 (created_at < cursor)
  // 첫 요청은 cursor 없이 보냄 → 최신 메시지부터 조회
  cursor?: string;

  // 한 번에 가져올 메시지 수 (기본값 50)
  size?: string;
}
