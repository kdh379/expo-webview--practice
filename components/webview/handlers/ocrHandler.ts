/**
 * OCR 관련 네이티브 함수 핸들러
 *
 * OCR 관련 네이티브 기능 중 함수 호출로 처리 가능한 기능을 구현합니다.
 * (스크린이 필요한 기능은 NativeScreenManager에서 처리)
 */

import type { MessageHandlers } from "../hooks/useMessageHandler";

// OCR 모달 컨트롤러 인터페이스
interface OCRModalController {
  showOCRModal: (
    documentType: OCRDocumentType,
    callback: (result: IDCardOCRResult) => void,
  ) => void;
  hideOCRModal: () => void;
}

/**
 * OCR 핸들러 생성 함수
 */
const createOCRHandlers = (
  ocrController?: OCRModalController,
): Pick<MessageHandlers, "OCR_SCAN_ID_CARD"> => ({
  OCR_SCAN_ID_CARD: async (id, _options) => {
    try {
      if (!ocrController) {
        return {
          id,
          success: false,
          error: "OCR 컨트롤러가 초기화되지 않았습니다.",
        };
      }

      // Promise를 생성하여 OCR 결과를 기다림
      const result = await new Promise<IDCardOCRResult>((resolve, reject) => {
        try {
          ocrController.showOCRModal("ID_CARD", (ocrResult) => {
            if (typeof ocrResult !== "string") {
              resolve(ocrResult);
            } else {
              reject(new Error("OCR 결과가 유효하지 않습니다."));
            }
          });
        } catch (error) {
          reject(error);
        }
      });

      return {
        id,
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("주민등록증 OCR 처리 오류:", error);
      return {
        id,
        success: false,
        error: "주민등록증 OCR 처리 중 오류가 발생했습니다.",
      };
    }
  },
});

export default createOCRHandlers;
