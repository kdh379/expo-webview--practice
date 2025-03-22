/**
 * 브릿지 핸들러 유틸리티
 *
 * 핸들러 생성 및 관리를 위한 헬퍼 함수들
 */

import { SCREENS } from "@/screens/config";
import type { ScreenController } from "@/screens/types";

import type { Handlers } from "./useMessageHandler";

/**
 * 화면 컨트롤러를 사용하여 화면 핸들러 객체를 생성합니다.
 *
 * @param controller - 화면 컨트롤러 객체
 * @returns 화면 핸들러 객체
 */
export const createScreenHandlersFromConfig = (
  controller: ScreenController,
): Handlers => {
  const handlers: Handlers = {};

  // 스크린 설정을 순회하며 핸들러 생성
  Object.entries(SCREENS).forEach(([name]) => {
    handlers[name as BridgeType] = (id: string, payload: any) => {
      return controller.showScreen(name as BridgeType, id, payload);
    };
  });

  return handlers;
};

/**
 * 여러 핸들러를 합쳐서 하나의 핸들러 맵으로 만듭니다.
 *
 * @param handlers 핸들러 객체 배열
 * @returns 통합된 핸들러 맵
 */
export const combineHandlers = (...handlers: Handlers[]): Handlers => {
  return Object.assign({}, ...handlers);
};
