# Pre-signed URL 업로드 구현 계획

## 현재 상태

### 다운로드 (완료)
- Pre-signed URL 방식으로 구현 완료
- Flow: FE → BE(URL 생성) → FE → S3(직접 다운로드)

### 업로드 (변경 필요)
- 현재: FE → BE(FormData) → BE가 S3 업로드
- 목표: FE → BE(URL 생성) → FE → S3(직접 업로드) → FE → BE(DB 등록)

## 문제점

Pre-signed URL 업로드 API(`generatePresignedUploadUrl`)는 있지만, **업로드 완료 후 DB 등록 API가 없음**.

현재 flow:
1. `POST /bookings/{id}/files/presigned-upload-url` → URL + objectKey 반환
2. FE가 S3에 직접 업로드
3. **❌ DB에 파일 정보 등록하는 단계 없음**

## 구현 계획

### Backend

#### 1. 파일 등록 API 추가
```
POST /bookings/{bookingId}/files/confirm-upload
```

**Request Body:**
```json
{
  "objectKey": "2026/03/uuid.pdf",
  "originalFileName": "resume.pdf",
  "contentType": "application/pdf",
  "fileSize": 1234567
}
```

**Response:**
```json
{
  "id": 1,
  "originalFileName": "resume.pdf",
  "fileSize": 1234567,
  "contentType": "application/pdf",
  "createdAt": "2026-03-06T12:00:00Z"
}
```

#### 2. 구현 파일

| 파일 | 변경 내용 |
|------|----------|
| `ConfirmUploadRequestDTO.java` | 새로 생성 - Request DTO |
| `BookingFileService.java` | `confirmUpload()` 메서드 추가 |
| `BookingFileController.java` | `POST /confirm-upload` 엔드포인트 추가 |
| `BookingFileControllerTest.java` | 테스트 추가 |
| `BookingFileServiceTest.java` | 테스트 추가 |

#### 3. confirmUpload 로직
```java
@Transactional
public BookingFileResponseDTO confirmUpload(
    Long bookingId,
    UUID requesterId,
    ConfirmUploadRequestDTO request
) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new CustomException(ErrorCode.BOOKING_NOT_FOUND));

    validateBookingAccess(booking, requesterId);

    // 파일 확장자 검증 (보안)
    fileUploadValidator.validateFileName(request.getOriginalFileName());

    // S3에 파일 존재 여부 확인 (선택적)
    // s3PresignedUrlService.exists(request.getObjectKey());

    BookingFile bookingFile = BookingFile.create(
        booking,
        extractFileName(request.getObjectKey()),  // UUID.pdf
        request.getOriginalFileName(),             // resume.pdf
        request.getObjectKey(),                    // 2026/03/UUID.pdf
        request.getFileSize(),
        request.getContentType()
    );

    return BookingFileResponseDTO.from(bookingFileRepository.save(bookingFile));
}
```

#### 4. presigned-upload-url 검증 강화
현재 `generatePresignedUploadUrl`에서 파일명/확장자 검증이 없음. 추가 필요:

```java
public PresignedUploadUrlResponseDTO generatePresignedUploadUrl(...) {
    // 기존 코드...

    // 추가: 파일명/확장자 검증
    fileUploadValidator.validateFileName(fileName);

    // 기존 코드...
}
```

---

### Frontend

#### 1. useUploadBookingFile 훅 변경

**현재 (BE 통해 업로드):**
```typescript
// hooks/useBookings.ts
export function useUploadBookingFile(id: number) {
    return useMutation({
        mutationFn: (files: FormData) => uploadBookingFile(id, files),
    });
}
```

**변경 후 (Pre-signed URL):**
```typescript
export function useUploadBookingFile(id: number) {
    return useMutation({
        mutationFn: async (file: File) => {
            // 1. Pre-signed URL 생성
            const { url, objectKey } = await getPresignedUploadUrl(
                id,
                file.name,
                file.type || 'application/octet-stream'
            );

            // 2. S3에 직접 업로드
            await uploadFileToS3(url, file);

            // 3. DB에 파일 등록
            return await confirmUpload(id, {
                objectKey,
                originalFileName: file.name,
                contentType: file.type || 'application/octet-stream',
                fileSize: file.size,
            });
        },
    });
}
```

#### 2. API 함수 추가

**api/bookings.ts:**
```typescript
export interface ConfirmUploadRequest {
    objectKey: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
}

export async function confirmUpload(
    bookingId: number,
    request: ConfirmUploadRequest
): Promise<IBookingFile> {
    return await httpClient<IBookingFile>(
        `${API_URL}/bookings/${bookingId}/files/confirm-upload`,
        {
            method: 'POST',
            body: request,
        }
    );
}
```

#### 3. 호출부 변경

**MyBookings.tsx, Booking.tsx:**

현재:
```typescript
const formData = new FormData();
formData.append('file', file);
await uploadFileAsync(formData);
```

변경 후:
```typescript
await uploadFileAsync(file);  // File 객체 직접 전달
```

#### 4. 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `api/bookings.ts` | `confirmUpload()` 함수 추가 |
| `api/index.ts` | export 추가 |
| `hooks/useBookings.ts` | `useUploadBookingFile` 로직 변경 |
| `pages/calendar/MyBookings.tsx` | 호출부 변경 (FormData → File) |
| `pages/calendar/Booking.tsx` | 호출부 변경 (FormData → File) |
| `pages/calendar/MyBookings.test.tsx` | mock 업데이트 |

---

## 구현 순서

1. **BE: ConfirmUploadRequestDTO 생성**
2. **BE: BookingFileService.confirmUpload() 구현**
3. **BE: BookingFileController에 엔드포인트 추가**
4. **BE: 테스트 작성**
5. **FE: confirmUpload API 함수 추가**
6. **FE: useUploadBookingFile 훅 변경**
7. **FE: 호출부 수정 (MyBookings.tsx, Booking.tsx)**
8. **FE: 테스트 업데이트**

---

## 보안 고려사항

1. **확장자 검증**: presigned URL 생성 시 + confirm 시 이중 검증
2. **파일 크기 검증**: confirm 시 전달받은 fileSize 검증
3. **S3 파일 존재 확인**: (선택) confirm 전에 objectKey가 실제로 S3에 있는지 확인
4. **중복 등록 방지**: 같은 objectKey로 중복 등록 시 에러 처리

---

## 롤백 계획

기존 `POST /bookings/{id}/files` (FormData 업로드) API는 유지.
문제 발생 시 FE에서 `useUploadBookingFile`만 이전 버전으로 롤백.
