# 군 수당 가이드

간부·병사·군무원이 받을 수 있는 수당과 신청 방법을 안내하는 사이트입니다. AI 수당 상담 챗봇이 함께 들어 있습니다.

- **스택:** Next.js 14(App Router) · TypeScript · Supabase(선택) · Claude API(선택)
- **배포 대상:** GitHub → Vercel, DB는 Supabase
- **환경변수가 하나도 없어도** 로컬에서 모든 화면이 동작합니다. 이때 챗봇은 AI 없이 규칙 기반으로 답합니다.

## 바로 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드·실행 |
| `npm test` | 단위 테스트(찾기 로직, 가족수당 계산, 개인정보 가림, 검색) |
| `npm run typecheck` / `npm run lint` | 타입·린트 검사 |
| `npm run build:preview` | 서버 없이 열리는 정적 미리보기를 `out/`에 생성 (챗봇은 규칙 기반) |
| `npm run seed:sql` | `data/allowances.ts` → `supabase/seed.sql` 생성 |

## 화면

| 경로 | 화면 |
|---|---|
| `/` | 홈 (내 수당 찾기, 검색, 대상별 바로가기, 상황별 가이드) |
| `/finder` | 내 수당 찾기 (질문 단계 → 결과, 결과는 URL로 공유 가능) |
| `/allowances` | 수당 전체보기 (대상별/이름별, 검색·필터) |
| `/allowances/[id]` | 수당 상세 (지급 기준, 대상, 신청 방법, 서류, 근거 규정, 확인일) |
| `/guides`, `/guides/[id]` | 상황별 가이드 + 체크리스트 |
| `/faq` | 자주 묻는 질문 |
| 우측 하단 버튼 | AI 수당 상담 챗봇 (모든 화면) |

## 폴더 구조

```
app/                    화면과 API
  api/chat/route.ts     챗봇 API (검색 → Claude → 근거 첨부, 실패 시 규칙 답변)
  api/feedback/route.ts 답변 평가 저장
components/             UI 컴포넌트 (ChatWidget, Finder, Nav …)
data/allowances.ts      ★ 수당 데이터 — 사이트·찾기·챗봇이 함께 쓰는 단일 출처
data/guides.ts          상황별 가이드, FAQ
lib/finder.ts           조건별 수당 찾기·금액 계산
lib/search.ts           키워드 검색 (챗봇 근거 검색에도 사용)
lib/chat.ts             챗봇 프롬프트·근거 구성·Claude 호출
lib/safety.ts           개인정보·보안어 검사
supabase/migrations/    DB 스키마
tests/                  단위 테스트
```

## 수당 정보 수정하기

1. `data/allowances.ts`에서 해당 항목을 고칩니다.
2. `verifiedAt`을 확인한 날짜로 바꿉니다. 원문 확인을 마쳤으면 `needsVerification: false`로 바꿉니다.
3. `npm test`로 확인하고 커밋합니다. 챗봇도 같은 데이터를 쓰므로 따로 고칠 필요가 없습니다.

> `needsVerification: true`(화면에 '확인 필요' 표시) 항목은 군인 적용 범위나 세부 금액을 아직 규정 원문으로 확인하지 못한 항목입니다. 공개 전에 행정 담당자 검토를 받으세요.

## AI 챗봇 동작

1. 입력에서 주민번호·전화번호·군번 등을 **가리고**, 보안 관련 단어가 있으면 답하지 않습니다.
2. `data/`에서 관련 수당·FAQ·가이드를 검색해 **근거 문서**를 만듭니다.
3. `ANTHROPIC_API_KEY`가 있으면 Claude가 근거 안에서만 답하고, 없거나 실패하면 규칙 기반으로 답합니다.
4. 모든 답변에 근거 규정·확인일·수당 상세 링크를 붙입니다.
5. `CHAT_LOG_ENABLED=true`이고 Supabase가 연결되어 있으면 가려진 질문과 답변을 저장합니다.

IP별 분당 20회 요청 제한이 들어 있습니다(서버리스 인스턴스 단위). 트래픽이 많아지면 Vercel WAF나 Upstash 같은 공용 저장소 기반 제한으로 바꾸세요.

## 배포 (나중에 연결할 때)

### 1. GitHub
```bash
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

### 2. Supabase
1. 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/migrations/20261120000000_init.sql`을 실행합니다. (CLI를 쓰면 `supabase link` → `supabase db push`)
3. (선택) `npm run seed:sql` 후 `supabase/seed.sql`을 실행해 수당 데이터를 DB에도 넣습니다.
4. Project Settings → API에서 **Project URL**과 **service_role key**를 복사합니다.

모든 테이블은 RLS가 켜져 있고 공개 정책이 없습니다. 브라우저에서는 접근할 수 없고 서버 API만 service role key로 씁니다.

### 3. Vercel
1. GitHub 저장소를 Import합니다. (Framework: Next.js, 설정 변경 없음)
2. Environment Variables에 아래 값을 넣습니다.

| 이름 | 필수 | 설명 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 선택 | 없으면 챗봇이 규칙 기반으로 답함 |
| `ANTHROPIC_MODEL` | 선택 | 사용할 Claude 모델 ID |
| `NEXT_PUBLIC_SUPABASE_URL` | 선택 | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | **서버 전용**. `NEXT_PUBLIC_` 접두사를 붙이지 마세요 |
| `CHAT_LOG_ENABLED` | 선택 | `true`면 대화 로그 저장 |

3. Deploy를 누르면 끝납니다. 이후 `main`에 푸시할 때마다 자동 배포됩니다.

### 운영 확인 (Supabase SQL)
```sql
select * from unanswered_questions limit 50;  -- 답 못 한 질문 → FAQ·데이터 보강
select * from negative_feedback limit 50;     -- '아쉬움' 평가 받은 답변
```

## 참고 출처
- 공무원수당 등에 관한 규정, 군인의 시간외근무수당 등에 관한 규정, 단기복무부사관 장려수당 지급 규정 (국가법령정보센터)
- 인사혁신처 공무원 보수체계·수당제도 안내
- 2026년 군인 봉급표 (공무원보수규정 별표 13)

이 사이트의 금액은 2026년 기준 참고용입니다. 실제 지급은 소속 부대 인사·급여 담당에게 확인하세요.
