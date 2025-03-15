/**
 * 네이티브 스크린 핸들러 모음
 *
 * 이 모듈은 웹뷰에서 요청한 네이티브 스크린(모달) 표시 요청을 처리하는 핸들러들을 모아놓은 모듈입니다.
 */

// 스크린 핸들러 타입 정의
export type ScreenHandler = (id: string, payload?: any) => boolean;

// 스크린 메시지 타입 정의
export type ScreenMessageType =
  | "CAMERA_SHOW"
  | "OCR_SCAN_ID_CARD"
  | "OCR_SCAN_DRIVER_LICENSE";

// 스크린 핸들러 맵 타입 정의
export type ScreenHandlers = {
  [key in ScreenMessageType]?: ScreenHandler;
};

// 스크린 컨트롤러 인터페이스
export interface ScreenController {
  showCamera: (id: string) => void;
  showOCR: (id: string, type: "ID_CARD" | "DRIVER_LICENSE") => void;
}

/**
 * 스크린 핸들러 생성 함수
 *
 * @param controller 스크린 컨트롤러
 * @returns 스크린 핸들러 맵
 */
export const createScreenHandlers = (
  controller: ScreenController,
): ScreenHandlers => {
  return {
    // 카메라 모달 표시
    CAMERA_SHOW: (id: string) => {
      controller.showCamera(id);
      return true;
    },

    // ID 카드 OCR 모달 표시
    OCR_SCAN_ID_CARD: (id: string) => {
      controller.showOCR(id, "ID_CARD");
      return true;
    },

    // 운전면허증 OCR 모달 표시
    OCR_SCAN_DRIVER_LICENSE: (id: string) => {
      controller.showOCR(id, "DRIVER_LICENSE");
      return true;
    },
  };
};
