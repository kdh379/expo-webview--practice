# Expo WebView 브릿지 프로젝트

[Expo](https://expo.dev)와 WebView를 이용한 네이티브-웹 브릿지 통신 구현 프로젝트입니다. 웹 애플리케이션에서 네이티브 기능(카메라, OCR, 다이얼로그 등)을 사용할 수 있도록 브릿지 인터페이스를 제공합니다.

## 주요 기능

- 웹뷰와 네이티브 간 양방향 브릿지 통신
- 네이티브 Alert 표시
- 카메라 접근 및 사진 촬영
- OCR(광학 문자 인식) 기능
- ~~블루투스 기능 연동~~ (Expo GO 제한으로 현재 미구현)

## 시작하기

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# iOS 시뮬레이터에서 실행
npx expo start --ios

# Android 에뮬레이터에서 실행
npx expo start --android
```

### 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요:

```sh
EXPO_PUBLIC_DEV_URL=http://your-local-ip:port
```

## 프로젝트 구조

```graphql
expo-webview-practice/
├── app/                    # Expo Router 기반 화면 컴포넌트
├── components/             # 재사용 가능한 UI 컴포넌트
│   ├── webview/            # WebView 관련 컴포넌트
│   │   ├── WebViewBridge.tsx       # 웹뷰 브릿지 메인 컴포넌트
│   │   ├── NativeScreenManager.tsx # 네이티브 스크린(모달) 관리
│   │   ├── constants/      # 상수 정의
│   │   ├── handlers/       # 브릿지 핸들러 구현
│   │   │   ├── index.ts            # 핸들러 통합 모듈
│   │   │   ├── dialogHandler.ts    # 다이얼로그 핸들러
│   │   │   ├── cameraHandler.ts    # 카메라 핸들러
│   │   │   ├── ocrHandler.ts       # OCR 핸들러
│   │   │   └── screenHandlers.ts   # 스크린(모달) 핸들러
│   │   ├── hooks/          # 커스텀 훅
│   │   │   └── useMessageHandler.ts # 메시지 처리 훅
│   │   └── lib/            # 유틸리티 함수
├── constants/              # 앱 전체 상수
├── hooks/                  # 앱 전체 커스텀 훅
├── types/                  # 타입 정의
│   ├── bridge.d.ts         # 브릿지 메시지 타입
│   ├── camera.d.ts         # 카메라 관련 타입
│   ├── ocr.d.ts            # OCR 관련 타입
│   └── user.d.ts           # 사용자 정보 타입
├── react-example/          # 웹 예제 코드
│   ├── lib/bridge.ts       # 웹측 브릿지 구현
│   └── components/         # 웹 컴포넌트 예제
└── assets/                 # 이미지, 폰트 등 정적 자원
```

## 브릿지 아키텍처

### 통신 흐름

1. **웹 → 네이티브 요청**:

   - 웹에서 `bridge.xxx()` 메서드 호출
   - 메시지가 `postMessage()`를 통해 네이티브로 전송

2. **네이티브 처리**:

   - `WebViewBridge.tsx`의 `onMessage` 이벤트에서 메시지 수신
   - `useMessageHandler` 훅이 메시지 타입에 따라 적절한 핸들러 호출
   - 일반 함수 호출은 `handlers`에서, 스크린(모달) 요청은 `screenHandlers`에서 처리

3. **네이티브 → 웹 응답**:
   - 처리 결과를 `sendResponse()` 또는 `sendErrorResponse()`로 웹에 전송
   - 웹에서는 Promise 형태로 결과 수신

### 핵심 컴포넌트

- **WebViewBridge**: 웹뷰 컴포넌트와 메시지 핸들링 로직 통합
- **NativeScreenManager**: 모달 화면(카메라, OCR 등) 관리
- **useMessageHandler**: 브릿지 메시지 처리 로직 구현
- **handlers/**: 각 기능별 핸들러 구현

## 브릿지 API 사용법

### 웹에서 사용 가능한 API

```javascript
// 알림 표시
const buttonClicked = await bridge.alert("제목", "메시지 내용", [
  { text: "확인", actionId: "confirm" },
  { text: "취소", actionId: "cancel" },
]);

// 카메라
const permission = await bridge.camera.requestPermission();
const picture = await bridge.camera.takePicture({ quality: 0.8 });

// OCR
const idCardResult = await bridge.ocr.scanIDCard();
const driverLicenseResult = await bridge.ocr.scanDriverLicense();
```

## 새로운 브릿지 기능 추가 방법

1. **타입 정의**:

   - `types/bridge.d.ts`에 메시지 타입 추가
   - 필요시 `types/xxx.d.ts`에 상세 타입 정의

2. **핸들러 구현**:

   - `components/webview/handlers/xxxHandler.ts` 파일 생성
   - `createXXXHandlers()` 함수 구현

3. **핸들러 등록**:

   - `components/webview/handlers/index.ts`에 핸들러 추가

4. **웹 API 구현**:
   - `react-example/lib/bridge.ts`에 웹측 API 구현

## 개발 가이드라인

### 네이밍 컨벤션

- **컴포넌트**: PascalCase (예: `WebViewBridge`)
- **함수/변수**: camelCase (예: `handleMessage`)
- **타입/인터페이스**: PascalCase (예: `BridgePayload`)
- **브릿지 메시지 타입**: UPPER\*SNAKE_CASE (예: `CAMERA_SHOW`) `기능\_명령\_타입`

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
