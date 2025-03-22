# Expo WebView 브릿지 프로젝트

[Expo](https://expo.dev) Bare Workflow(eject) 프로젝트에서 WebView를 이용한 네이티브-웹 브릿지 통신 구현 프로젝트입니다.

## 주요 기능

- 웹뷰와 네이티브 간 양방향 브릿지 통신
- 네이티브 Alert 표시
- 카메라 접근 및 사진 촬영
- OCR(광학 문자 인식) 기능

## 시작하기

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start

# 네테이브 관련 라이브러리 추가 시, local build + 실행이 1회 필요함
# xcode 또는 android studio 에서 빌드하거나, 아래 명령어로 실행
npx expo run:ios --device       # Xcode에 내 기기가 등록되어 있어야 함
npx expo run:android
```

### 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요:

```sh
# 웹뷰 프로젝트의 Node.js 주소 (e.g. http://192.168.1.100:3000)
EXPO_PUBLIC_DEV_URL=http://your-local-ip:port
```

## 프로젝트 구조

```sh
expo-webview-practice/
├── app/                    # Expo Router 기반 화면 컴포넌트
├── components/             # 재사용 가능한 UI 컴포넌트
│   ├── webview/            # WebView 관련 컴포넌트
│   │   ├── useMessageHandler.ts # 메시지 처리 훅
│   │   └── utils.ts        # 웹뷰 유틸리티 함수
├── features/               # 기능별 모듈
│   └── FEATURE_NAME/       # 기능 관련 기능
│   │   ├── handlers.ts     # 핸들러 로직
│   │   ├── modal.tsx       # 모달 컴포넌트
│   │   └── index.ts        # 진입점
├── screens/                # 네이티브 스크린 관리
│   ├── ScreenManager.tsx   # 스크린 관리 컴포넌트
│   ├── config.ts           # 스크린 설정
│   └── types.ts            # 스크린 관련 타입
├── types/                  # 브릿지 타입 정의
├── react-example/          # 웹 예제 코드
│   ├── lib/bridge.ts       # 웹측 브릿지 구현
│   └── components/         # 웹 컴포넌트 예제
└── assets/                 # 이미지, 폰트 등 정적 자원
```

## 브릿지 아키텍처

### 통신 흐름

1. **웹 → 네이티브 요청**:

   - 웹에서 `bridge("FEATURE_NAME", { ... })` 메서드 호출
   - 메시지가 `postMessage()`를 통해 네이티브로 전송

2. **네이티브 처리**:

   - `useMessageHandler` 훅이 메시지 타입에 따라 적절한 핸들러 호출
   - 각 기능별 핸들러는 features/ 디렉토리에 구현
   - 네이티브 스크린 호출이 필요하면, screens/config.ts 에 등록

3. **네이티브 → 웹 응답**:
   - 처리 결과를 `sendResponse()` 또는 `sendErrorResponse()`로 웹에 전송
   - 웹에서는 Promise 형태로 결과 수신

### 핵심 컴포넌트

- **components/webview/**: 웹뷰표시, 브릿지, 네테이브 스크린 호출 등 중앙 처리 로직
- **features/**: 각 기능별 모듈 구현
- **ScreenManager**: 네이티브 스크린 (카메라, OCR 등) 관리

## 브릿지 API 사용법

### 웹에서 사용 가능한 API

```javascript
// 알림 표시
const buttonClicked = await bridge("ALERT", {
  title: "제목",
  message: "메시지 내용",
  buttons: [
    { text: "확인", actionId: "confirm" },
    { text: "취소", actionId: "cancel" },
  ],
});

// 카메라
const permission = await bridge("CAMERA_REQUEST_PERMISSION", undefined);
const picture = await bridge("CAMERA_SHOW", { quality: 0.8 });

// OCR
const idCardResult = await bridge("OCR", {
  documentType: "ID_CARD",
  quality: 0.8,
});
```

## 새로운 브릿지 기능 추가 방법

1. **타입 정의**:

   - 전역 타입 확장으로 메시지 타입 추가
   - `types/index.d.ts` 파일에 타입 추가

2. **핸들러 구현**:

   - `features/xxx/handlers.ts` 파일 생성
   - `Handlers` 타입에 맞게 핸들러 객체 구현

3. **컴포넌트 구현 (필요시)**:

   - `features/xxx/xxx.tsx`에 관련 UI 컴포넌트 구현
   - `screens/config.ts`에 스크린으로 등록 (모달이 필요한 경우)

## 개발 가이드라인

### 타입 안전성

- 모든 메시지 핸들러는 타입 안전하게 구현
- `any` 타입 사용 최소화
- 정확한 인터페이스 정의로 타입 오류 방지

### 네이밍 컨벤션

- **타입/인터페이스**
  - 브릿지 요청: PascalCase (예: `CameraPayload`)
  - 브릿지 응답: camelCase (예: `CameraResult`)

## 알려진 제한사항

- **블루투스 기능**: Expo GO에서는 BLE 기능 사용 불가 (네이티브 코드 접근 필요)
- **카메라/OCR**: 실제 기기에서만 정상 작동 (시뮬레이터에서는 제한적 기능)
- **웹뷰 디버깅**: Chrome 개발자 도구를 통한 원격 디버깅 권장

## 문제 해결

### 일반적인 문제

- **브릿지 통신 오류**: 웹뷰 콘솔 로그 확인, 메시지 형식 검증
- **권한 문제**: 카메라, 저장소 등 필요한 권한 요청 확인
- **화면 렌더링 이슈**: 스타일 충돌 확인, 레이아웃 디버깅

### 디버깅 팁

- Expo 개발 서버 로그 확인
- 웹뷰 내 `console.log` 출력 확인
- React DevTools 사용
- 네트워크 요청 모니터링
