---
name: Bug Report
about: 버그 제보를 위한 이슈 (보안 이슈 포함)
title: '[BUG] FE 배포 성공 후 www 도메인 반영 실패 (DNS가 ALB를 가리킴)'
labels: bug
assignees: ''
---

## 🎯 목표 (What & Why)

**What**: Frontend GitHub Actions 배포가 성공(S3 업로드 + CloudFront invalidation 완료)했음에도 `https://www.cohi-chat.com`에서 구버전 해시 파일을 계속 참조하고 404가 발생함.

**Why**: 사용자에게 최신 프론트가 반영되지 않고 화면 로딩 실패(정적 자원 404)가 발생함. FE 배포 자동화 신뢰성을 크게 저하시킴.

## 📦 구체적으로 무엇을 고칠지 (Deliverables)

| 항목 | 내용 |
|---|---|
| 발생 위치 | Route53, CloudFront, FE 배포 워크플로우 |
| 재현 방법 | 1. FE 배포 실행 2. `www.cohi-chat.com` 접속 3. 이전 해시 js/css 요청(404) 확인 |
| 예상 동작 | FE 배포 후 `www.cohi-chat.com`이 최신 해시 js/css를 반환 |
| 실제 동작 | 배포 성공 로그와 무관하게 도메인이 이전 해시(`index-B65ViQ6i.js`, `index-BAbG6Fz4.css`)를 참조 |

**스크린샷/로그**
```text
GET https://www.cohi-chat.com/assets/index-BAbG6Fz4.css 404
GET https://www.cohi-chat.com/assets/index-B65ViQ6i.js 404
```

```bash
$ dig +short www.cohi-chat.com
43.200.89.47
43.202.151.253
3.37.249.95
13.209.198.156
```

```bash
$ curl -I https://www.cohi-chat.com | grep -Ei "server|via|x-cache"
server: nginx
```

원인 파악 후:
```bash
$ dig +short www.cohi-chat.com
3.171.185.100
3.171.185.63
3.171.185.88
3.171.185.97
```

```bash
$ curl -I https://www.cohi-chat.com | grep -Ei "server|via|x-cache"
server: AmazonS3
x-cache: Miss from cloudfront
via: ...cloudfront.net (CloudFront)
```

## 🙅 다음은 하지 않음 (Out of Scope)

- 백엔드 비즈니스 로직 수정
- 프론트 기능 코드 자체 수정
- CloudFront/ALB 비용 최적화

## ✅ 체크포인트 (Check Point)

- [x] 버그 원인 파악
- [x] 수정 코드 작성 (FE 배포 워크플로우 보강)
- [x] 인프라 설정 수정 (Route53 -> CloudFront 전환)
- [ ] `/api/*` CloudFront -> ALB 라우팅 운영 기준 문서화 최종 점검
- [ ] 코드리뷰 완료

---

**우선순위**: High

**핵심 원인 요약**
- Route53의 `cohi-chat.com`/`www.cohi-chat.com` A Alias가 CloudFront가 아니라 ALB를 가리킴.
- 따라서 S3+CloudFront FE 배포 결과가 사용자 도메인에 반영되지 않음.

**해결 요약**
- Route53 A Alias를 CloudFront 배포(`E2TSEBMG1RADEW`)로 전환.
- CloudFront에서 `/api/*` behavior를 ALB origin으로 분리.

