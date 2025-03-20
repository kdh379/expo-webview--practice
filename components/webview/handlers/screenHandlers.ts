/**
 * 네이티브 스크린 핸들러 모음
 *
 * 이 모듈은 웹뷰에서 요청한 네이티브 스크린(모달) 표시 요청을 처리하는 핸들러들을 모아놓은 모듈입니다.
 */

import type { ScreenHandlers } from "@/components/webview/hooks/useMessageHandler";

// 스크린 컨트롤러 인터페이스
export interface ScreenController {
  showCamera: (id: string) => void;
  showOCR: (id: string, options?: OCRPayload) => void;
  showVisionCamera: (id: string) => void;
  showVisionOCR: (id: string) => void;
  showDocumentScanner: (id: string) => void;
}

/**
 * 스크린 핸들러 생성 함수
 *
 * @param controller 스크린 컨트롤러
 * @returns 스크린 핸들러 맵
 */
export const createScreenHandlers = (
  controller: ScreenController,
): Partial<ScreenHandlers> => {
  return {
    // 카메라 모달 표시
    CAMERA_SHOW: (id: string, payload) => {
      console.log("showCamera", id, payload);

      controller.showCamera(id);
      return true;
    },

    // ID 카드 OCR 모달 표시
    OCR_SCAN_ID_CARD: (id, payload) => {
      controller.showOCR(id, payload);
      return true;
    },

    // VisionCamera 모달 표시
    VISION_CAMERA_SHOW: (id: string) => {
      controller.showVisionCamera(id);
      return true;
    },

    // VisionOCR 모달 표시
    VISION_OCR_SHOW: (id: string) => {
      controller.showVisionOCR(id);
      return true;
    },

    // DocumentScanner 모달 표시
    DOCUMENT_SCANNER_SHOW: (id: string) => {
      controller.showDocumentScanner(id);
      return true;
    },
  };
};
