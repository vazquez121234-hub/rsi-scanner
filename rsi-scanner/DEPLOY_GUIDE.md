# 🚀 배포 가이드 (5분이면 끝!)

## 준비물
- 이메일 또는 구글 계정 1개 (이미 있으면 OK)

---

## Step 1: GitHub 가입 + 저장소 만들기

1. **https://github.com** 접속
2. **Sign up** 클릭 → 이메일/비밀번호 입력 → 가입 완료
3. 오른쪽 상단 **+** 버튼 → **New repository** 클릭
4. Repository name: `rsi-scanner` 입력
5. **Public** 선택
6. **Create repository** 클릭

---

## Step 2: 파일 업로드

1. 생성된 저장소 페이지에서 **uploading an existing file** 링크 클릭
2. 이 ZIP 파일 속 **모든 파일과 폴더**를 드래그 앤 드롭
   - `package.json`
   - `pages/` 폴더 (api/rsi.js, index.js 포함)
3. 아래 **Commit changes** 버튼 클릭

### ⚠️ 중요: 폴더 구조 확인
업로드 후 저장소에 이렇게 보여야 합니다:
```
package.json
pages/
  api/
    rsi.js
  index.js
```

---

## Step 3: Vercel 배포

1. **https://vercel.com** 접속
2. **Sign Up** → **Continue with GitHub** 클릭 → GitHub 계정 연동
3. 대시보드에서 **Add New → Project** 클릭
4. `rsi-scanner` 저장소 선택 → **Import** 클릭
5. 설정은 아무것도 건드리지 말고 → **Deploy** 클릭
6. 1~2분 후 배포 완료!

---

## Step 4: 내 사이트 확인

배포가 완료되면 이런 주소가 생깁니다:
```
https://rsi-scanner-xxxxx.vercel.app
```

이 주소를 카톡으로 가족에게 보내면 끝!

---

## 사용법

- 사이트 접속하면 자동으로 14종목 주봉 RSI를 가져옵니다
- **새로고침** 버튼 → 최신 데이터 갱신 (무료, 무제한)
- 종목 탭하면 → 상세 RSI + 전략 가이드
- 매수구간/매도구간 탭 → RSI 30/70 근처 종목만 필터

---

## FAQ

**Q: 비용이 드나요?**
A: Vercel 무료 플랜으로 충분합니다. 월 100GB 트래픽까지 무료.

**Q: 가족이 몇 명까지 볼 수 있나요?**
A: 제한 없습니다. 링크만 있으면 누구나.

**Q: 데이터가 정확한가요?**
A: Yahoo Finance 실시간 데이터 → RSI(14) 직접 계산. 토스증권과 동일한 공식.

**Q: 주봉 RSI는 언제 바뀌나요?**
A: 미국 시장 기준 매주 금요일 장 마감 후 주봉이 확정됩니다.
   그래서 주 1~2회 확인이면 충분합니다.

**Q: 사이트를 수정하고 싶으면?**
A: GitHub에서 파일 수정 → Vercel이 자동으로 재배포합니다.
