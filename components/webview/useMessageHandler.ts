import { useCallback } from "react";

import {
  createScreenHandlersFromConfig,
  combineHandlers,
} from "@/components/webview/utils";
import { cameraHandler } from "@/features/camera";
import dialogHandler from "@/features/dialog/handler";
import { useScreens } from "@/screens/ScreenManager";

import type { WebViewMessageEvent } from "react-native-webview";

// 핸들러 주요 타입
export type Handlers = {
  [T in BridgeType]?: (
    id: string,
    payload: bridges[T]["payload"],
  ) =>
    | Promise<BridgeResponse<bridges[T]["response"]>>
    | BridgeResponse<bridges[T]["response"]>
    | boolean;
};

interface UseMessageHandlerProps {
  sendResponse: (id: string, data: any) => void;
  sendErrorResponse: (id: string, error: string) => void;
}

/**
 * 웹뷰 메시지 핸들러 훅
 *
 * 모든 브릿지 메시지를 처리하는, 중앙 처리기입니다.
 */
export const useMessageHandler = ({
  sendResponse,
  sendErrorResponse,
}: UseMessageHandlerProps) => {
  const { screenController } = useScreens();
  // 스크린 핸들러 생성 (config.ts의 스크린 설정에서 자동 생성)
  const screenHandlers = createScreenHandlersFromConfig(screenController);

  // 기능별 핸들러 생성
  const functionHandlers = {
    ...cameraHandler,
    ...dialogHandler,
  };

  const allHandlers = combineHandlers(screenHandlers, functionHandlers);

  // 메시지 처리 함수
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        // 웹에서 받은 메시지 파싱
        const message = JSON.parse(event.nativeEvent.data) as {
          id: string;
          type: string;
          payload: unknown;
        };

        const { type, id, payload } = message;
        const bridgeType = type as BridgeType;

        // 핸들러 찾기
        const handler = allHandlers[bridgeType];
        if (!handler) {
          // 핸들러가 없으면 에러 응답
          sendErrorResponse(id, `지원하지 않는 메시지 타입입니다: ${type}`);
          return;
        }

        // 핸들러 실행
        const processMessage = async () => {
          try {
            const result = await handler(id, payload as never);

            // boolean 응답은 스크린 핸들러에서 이미 처리됨
            if (result === true) return null;

            // 결과가 있으면 응답 처리
            if (result && typeof result === "object") {
              const response = result as BridgeResponse;
              if (response.success) {
                sendResponse(response.id, response.data);
              } else {
                sendErrorResponse(
                  response.id,
                  response.error || "알 수 없는 오류가 발생했습니다.",
                );
              }
            }
          } catch (error) {
            console.error("메시지 처리 오류:", error);
            sendErrorResponse(
              id,
              error instanceof Error
                ? error.message
                : "메시지 처리 중 오류가 발생했습니다.",
            );
          }
        };

        // 비동기 처리 시작
        processMessage();
      } catch (error) {
        console.error("메시지 파싱 오류:", error);
        sendErrorResponse("error", "메시지 파싱 중 오류가 발생했습니다.");
      }
    },
    [allHandlers, sendResponse, sendErrorResponse],
  );

  return { handleMessage };
};
