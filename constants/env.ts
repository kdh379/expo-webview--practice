import { Platform } from "react-native";

// 현재 플랫폼 확인을 위한 디버깅 로그
console.log("현재 플랫폼:", Platform.OS);
console.log("환경 변수 DEV_URL:", process.env.EXPO_PUBLIC_DEV_URL);

// 개발 환경에서 PC의 localhost에 접근하기 위한 IP 설정
const getDevUrl = () => {
  const url = process.env.EXPO_PUBLIC_DEV_URL;
  // 실제 디바이스나 Expo Go에서는 환경 변수의 URL을 우선 사용
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_DEV_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.",
    );
  }

  return url;
};

const DEV_URL = getDevUrl();
console.log("최종 선택된 URL:", DEV_URL);

// Expo Go에서 사용할 URL 설정
export const NEXT_URL = __DEV__
  ? DEV_URL
  : process.env.EXPO_PUBLIC_PROD_URL || "https://your-production-url.com";
