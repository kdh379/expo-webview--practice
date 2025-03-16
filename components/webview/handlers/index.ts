/**
 * 네이티브 함수 호출 핸들러 모음
 *
 * 이 모듈은 웹뷰에서 요청한 네이티브 함수 호출을 처리하는 핸들러들을 모아놓은 모듈입니다.
 * 스크린(모달) 관련 요청은 NativeScreenManager에서 별도로 처리합니다.
 */

import createCameraHandlers from "./cameraHandler";
import createDialogHandlers from "./dialogHandler";
import createUserHandlers from "./userHandler";

import type { MessageHandlers } from "../hooks/useMessageHandler";

/**
 * 모든 네이티브 함수 호출 핸들러를 생성하여 반환합니다.
 *
 * @param options 핸들러 생성 옵션
 * @returns 통합된 메시지 핸들러 맵
 */
export const createHandlers = (): Partial<MessageHandlers> => {
  return {
    ...createDialogHandlers(),
    ...createUserHandlers(),
    ...createCameraHandlers(),
    // ...createOCRHandlers(),
    // 필요한 경우 추가 핸들러 등록
  };
};
