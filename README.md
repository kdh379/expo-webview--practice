# Expo Webview 프로젝트

 [Expo](https://expo.dev)와 WebView를 이용한 브릿지 테스트 프로젝트입니다.

## 주요 기능

- 웹뷰와 네이티브 간 브릿지 통신
- 네이티브 다이얼로그 표시
- ~~블루투스 기능 연동~~

```bash
npm install
npx expo start
```

## 개발 환경 설정

### 환경 변수

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```
EXPO_PUBLIC_DEV_URL=실제IP주소
```

## 브릿지 API

브릿지를 통해 다음과 같은 기능들을 사용할 수 있습니다:

- 알림 표시: `bridge.alert()`
- 확인 대화상자: `bridge.confirm()`
- 토스트 메시지: `bridge.toast()`
- 화면 이동: `bridge.navigate()`
- 사용자 정보: `bridge.getUserInfo()`, `bridge.setUserInfo()`
- 블루투스: `bridge.bluetooth.*`

## 블루투스 권한

결론: Expo에선 BLE를 구현하기 어렵다.

[react-native-ble-plx](https://github.com/Polidea/react-native-ble-plx) 라이브러리를 사용하여 블루투스 기능을 구현해보고자 하였다.

- 결국 네이티브 코드에 접근이 필요하다.
- `npx expo prebuild`를 통해 네이티브 프로젝트로 전환해야 했다.
- 이러면 Expo GO 같은 편의 기능을 이용할 수가 없다.