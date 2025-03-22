/**
 * 카메라 기능 핸들러
 */
import { Camera } from "expo-camera";

import type { Handlers } from "@/components/webview/useMessageHandler";

/**
 * 카메라 핸들러 생성
 *
 * @returns 카메라 관련 핸들러 객체
 */
export const cameraHandler: Handlers = {
  // 카메라 권한 요청 핸들러
  CAMERA_REQUEST_PERMISSION: async (id: string, _payload: any) => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      // status를 명시적으로 타입 지정
      const permissionStatus = status as "granted" | "denied" | "undetermined";

      const response: CameraPermissionResponse = {
        camera: {
          status: permissionStatus,
          granted: permissionStatus === "granted",
          expires: "never",
        },
        microphone: {
          status: permissionStatus, // 마이크도 같은 상태 사용
          granted: permissionStatus === "granted",
          expires: "never",
        },
      };

      return {
        id,
        success: true,
        data: response,
      };
    } catch (error) {
      console.error("카메라 권한 요청 오류:", error);
      return {
        id,
        success: false,
        error: "카메라 권한 요청에 실패했습니다.",
      };
    }
  },

  // 카메라 실행은 스크린 핸들러로 처리됨 (별도 처리 필요 없음)
  // CAMERA_SHOW는 screens/config.ts에서 자동으로 등록됨
};
