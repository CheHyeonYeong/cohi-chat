### 작업 사이즈 산정 기준

> 출처: https://github.com/CheHyeonYeong/cohi-chat/wiki/작업-사이즈-산정-기준

이슈 생성 시 사용자에게 아래 기준으로 Priority, Size를 질문하고 Project 필드에 설정한다.

#### Priority (우선순위)

단위: P0 / P1 / P2 / P3

| 값 | 설명 |
|----|------|
| P0 | 지금 안 하면 장애 / 일정 붕괴 |
| P1 | 이번 스프린트에 반드시 필요 |
| P2 | 하면 좋은데 밀려도 됨 |
| P3 | 백로그용 |

#### Size (작업 크기)

단위: S / M / L / XL

| 값 | 설명 |
|----|------|
| S | 반나절~1일 |
| M | 1~2일 |
| L | 3~5일 |
| XL | 쪼개야 함 (설계 다시) |

#### Estimate (예상 소요)

- 단위: 개발자 작업일 기준 (0.5d / 1d / 2d / 3d)
- Size는 "감각", Estimate는 "약속용 수치"

#### Start date / Target date

- Start date: 실제 착수일 (YYYY-MM-DD)
- Target date: 리뷰 + QA 포함 완료 목표일 (YYYY-MM-DD)
