# CloudFront + S3 + ALB 배포 운영 가이드

## 1. 배경

현재 운영 구조는 아래를 목표로 한다.

- 정적 프론트: `S3 + CloudFront`
- API: `CloudFront(/api/*) -> ALB -> EC2 backend`

이번 장애는 FE 배포는 성공했지만 DNS가 ALB를 가리켜 CloudFront 결과가 노출되지 않아 발생했다.

## 2. 아키텍처 정리

### 정상 구조

1. GitHub Actions가 `frontend/dist`를 S3에 업로드
2. CloudFront invalidation 수행
3. 사용자 도메인(`www.cohi-chat.com`)이 CloudFront로 라우팅
4. CloudFront 기본 경로(`*`)는 S3 정적 파일 전달
5. `/api/*`만 ALB로 전달

### 장애 구조(실제 발생)

1. FE 배포 성공
2. Route53이 `www.cohi-chat.com`을 ALB로 직접 라우팅
3. 사용자는 CloudFront가 아닌 EC2/ALB 응답 확인
4. 최신 정적 파일 반영 실패 및 해시 mismatch 404 발생

## 3. 증상 패턴

다음 조합이면 DNS 라우팅 불일치 가능성이 높다.

- GitHub Actions FE 배포는 success
- 브라우저는 구해시 js/css 요청
- `curl -I` 응답이 `server: nginx`
- `dig +short www.<domain>`이 EC2/ALB IP 대역

## 4. 즉시 진단 명령어

```bash
# 현재 도메인이 참조하는 해시 파일 확인
curl -s https://www.cohi-chat.com | grep -o 'assets/index-[^"]*'

# DNS 대상 확인 (CloudFront IP 대역인지 확인)
dig +short www.cohi-chat.com

# 현재 응답 주체 확인
curl -I https://www.cohi-chat.com | grep -Ei "server|via|x-cache"
```

정상 예시:

- `server: AmazonS3`
- `via: ...cloudfront.net (CloudFront)`
- `x-cache: Miss/Hit from cloudfront`

## 5. Route53 설정 기준

Hosted zone: `cohi-chat.com`

- `www.cohi-chat.com` A Alias -> CloudFront distribution
- `cohi-chat.com` A Alias -> CloudFront distribution (또는 www로 리다이렉트)
- `NS`, `SOA`, ACM 검증용 `_xxxx` CNAME은 유지

주의:

- `www` 레코드 입력 시 이름칸에는 `www`만 입력한다.
- `www.cohi-chat.com` 전체를 입력하면 중복 구성 위험이 있다.

## 6. CloudFront 설정 기준

Distribution ID: `E2TSEBMG1RADEW`

### General

- Alternate domain names: `cohi-chat.com`, `www.cohi-chat.com`
- Custom SSL certificate: `us-east-1` ACM 인증서
- Default root object: `index.html`

### Origins

1. S3 origin
- bucket: `cohi-chat-config`
- origin path: `/frontend/dist`

2. ALB origin
- domain: `cohi-chat-alb-...ap-northeast-2.elb.amazonaws.com`
- origin protocol policy: 우선 `HTTP only` (안정화 후 필요 시 HTTPS 검토)
- origin path: 비움

### Behaviors

1. Default (`*`)
- origin: S3

2. `/api/*`
- origin: ALB
- viewer protocol policy: `Redirect HTTP to HTTPS`
- allowed methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
- cache policy: `CachingDisabled`
- origin request policy: `AllViewerExceptHostHeader`

## 7. GitHub Actions 배포 기준

파일: `.github/workflows/client-deploy-prod.yml`

권장 동작:

1. `frontend/dist` -> `s3://cohi-chat-config/frontend/dist` 동기화
2. 동일 산출물 -> `s3://cohi-chat-config` 동기화 (origin path 변동 대응)
3. `index.html`은 `no-cache, no-store, must-revalidate`로 재업로드
4. CloudFront `/*` invalidation

## 8. 502 트러블슈팅(CloudFront -> ALB)

증상:

```bash
curl -I https://www.cohi-chat.com/api/health
# HTTP/2 502
```

점검 순서:

1. ALB 직접 확인
```bash
curl -I http://cohi-chat-alb-...elb.amazonaws.com/api/health
```

2. 200/401/403이면 ALB/backend는 살아있음
3. CloudFront ALB origin protocol을 `HTTP only`로 맞춤
4. 배포 상태 `Deployed` 대기 후 재검증

## 9. 운영 체크리스트(배포 직후 1분)

1. FE 액션 success 확인
2. 아래 3개를 즉시 실행

```bash
dig +short www.cohi-chat.com
curl -I https://www.cohi-chat.com | grep -Ei "server|via|x-cache"
curl -s https://www.cohi-chat.com | grep -o 'assets/index-[^"]*'
```

3. API 라우팅 확인

```bash
curl -I https://www.cohi-chat.com/api/health
```

4. 결과 기준
- FE: 최신 해시 노출
- API: 502만 아니면 라우팅 성공(인증 정책에 따라 401/403 가능)

## 10. 후속 정리 항목

- `docker-compose.prod.yml`에서 frontend 서비스 운영 필요성 재검토
- DNS/CloudFront 변경 권한(IAM) 최소 권한 정책 문서화
- 장애 대응 runbook를 `docs` 인덱스에 연결

