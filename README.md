## 📖 프로젝트 소개

### 개요
커피챗
기획에서 출시까지 FastAPI 개발 백서를 기반으로 spring java migration 진행 및 AWS 1GB으로 배포목표

### 프로젝트 기간

`251219 ~ 260131`

### 프로젝트 비전(MVP)


## ✨ 주요 기능


## 🛠 기술 스택
java spring
react
sqllite

## 🏗️ 인프라 아키텍처


## 👥 팀 소개
### 팀 규칙
1. 우리는 깃허브 외에 볼거리 만들지 않기 제발
2. 회의록=> 깃허브 readme로 작성하기, 회의 주기-> 주1회
3. api명세서는 http://[ip]/docs
4. ci/cd -> 깃액션(젠킨스)
5. 브랜치전략
6. qa서버
7. 운영서버
8. DB -> dbeaver // connection pool 정보
9. git prj

### 프로젝트 팀 구성 및 역할

|         **FullStack**         |         **FullStack**          |    
| :-------------------------: | :--------------------------: | 
|      ![채현영][chehyeonyeong]      |      ![김희수][]      | 
| **[채현영][musung_g]** | **[김희수][sungyun_g]** |
|   _"열린 자세로 배우기"_    |     _"바로 서버 정상화"_     | 

### 코드리뷰 문화

저희는 [뱅크샐러드의 코드리뷰 방법으로 유명한 Pn룰](https://blog.banksalad.com/tech/banksalad-code-review-culture/)을 적극적으로 도입하여 효과적이고 건설적인 코드리뷰 문화를 만들어가려 노력하고 있어요.
도입하게된 계기는 아래와 같은 점들이에요.

- 비언어적인 표현전달의 한계로 의사 전달의 불확실성의 우려
- 왜곡될 수 있는 강조 및 감정 표현 예방
- 적극적이고 상호 배려하는 코드 리뷰 문화 조성

모든 리뷰어들은 피드백 의견의 강도에 따라 P5 ~ P1을 먼저 코멘트에 밝혀요.
모든 리뷰어는 피드백 의견의 강도에 따라 아래와 같이 P5부터 P1까지의 우선순위를 코멘트 앞에 명시합니다:

<table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; text-align: left; width: 100%;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th style="width: 20%;">우선순위</th>
      <th style="width: 35%;">설명</th>
      <th style="width: 45%;">예제</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>P5<br>(질문 및 추천)</strong></td>
      <td>제안사항으로, 반드시 반영할 필요는 없습니다.</td>
      <td>P5 - 이런 식으로 리팩토링하면 더 간결해질 수 있을 것 같아요.</td>
    </tr>
    <tr>
      <td><strong>P4<br>(가벼운 제안)</strong></td>
      <td>가급적 고려되길 권장하지만 반드시 수정할 필요는 없습니다.</td>
      <td>P4: 변수명을 조금 더 명확하게 바꿔보는 건 어떨까요?</td>
    </tr>
    <tr>
      <td><strong>P3<br>(중요)</strong></td>
      <td>비교적 기능에 영향을 미칠 수 있는 가능성이 미미하게 존재해 수정을 적극적으로 고려해야 합니다. <br>중요한 개선 사항이거나 모호한 부분에 대한 질문입니다.</td>
      <td>P3) 이 로직은 경계값 테스트를 추가하는 게 좋아 보여요. 의견 주세요.</td>
    </tr>
    <tr>
      <td><strong>P2<br>(매우 중요)</strong></td>
      <td>코드 품질이나 기능에 영향을 미칠 수 있는 사항으로, 반드시 반영해야 합니다.<br>P2부터는 반드시 리뷰어와 반영 여부를 논의후 결정하여야 합니다.</td>
      <td>P2) 여기서 무한 루프 가능성이 있습니다. 수정이 필요합니다.</td>
    </tr>
    <tr>
      <td><strong>P1<br>(최우선)</strong></td>
      <td>즉각 수정해야 할 중대한 문제로, 배포 시점 전에 반드시 해결되어야 합니다.</td>
      <td>P1) 이 부분은 비즈니스 로직이 잘못 구현되었습니다. 수정하지 않으면 심각한 버그가 발생할 수 있습니다.</td>
    </tr>
  </tbody>
</table>

### 기술공유 문화

프로젝트를 진행하며 이번에 집중적으로 다루며 새롭게 학습한 기술 및 지식들이나, 이번에는 미처 사용해보지 못했지만 **휘발되기 아까운 지식들이 매우 자주 생겨났습니다.** <br>
이러한 지식을 팀 내에서 공유하면 개인의 성장이 팀 전체의 성장으로 이어질 수 있다는 믿음으로, 저희는 자율적이고 활발한 지식 공유 문화를 만들었어요. <br>
![image](https://github.com/user-attachments/assets/d67c938b-aece-4bbd-ac40-6c1bec9ff30b)

- 모든 팀원이 자유주제로 조사하거나 경험한 지식을 매주 1개 이상씩 자체적인 기술 세미나 시간에 공유하며 자유롭게 토론해요 📖 <br>
- 강제적인 발표가 아닌, 배우고 나누고자 하는 열정에서 출발한 시간이기에, 모두가 즐겁게 지식을 공유하는 시간이 될 수 있었어요 ✌️

[musung]: https://avatars.githubusercontent.com/u/63047990?v=4
[sungyun]: https://avatars.githubusercontent.com/u/79460319?v=4
