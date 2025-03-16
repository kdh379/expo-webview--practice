import { useCallback } from "react";

import { createHandlers } from "../handlers";
import { createScreenHandlers } from "../handlers/screenHandlers";

import type {
  ScreenController,
  ScreenMessageType,
} from "../handlers/screenHandlers";
import type { WebViewMessageEvent } from "react-native-webview";

// 메시지 핸들러 타입 정의
// export type HandlerFunction<T extends BridgeType> = (
//   id: string,
//   payload: bridges[T]["payload"],
// ) => Promise<bridges[T]["response"]> | bridges[T]["response"];

export type MessageHandlers = {
  [T in BridgeType]: (
    id: string,
    payload: bridges[T]["payload"],
  ) =>
    | Promise<BridgeResponse<bridges[T]["response"]>>
    | BridgeResponse<bridges[T]["response"]>;
};

// 메시지 핸들러 훅 Props 타입
interface UseMessageHandlerProps {
  sendResponse: (id: string, data: any) => void;
  sendErrorResponse: (id: string, error: string) => void;
  screenController: ScreenController;
}

/**
 * 웹뷰 메시지 핸들러 훅
 *
 * 네이티브 함수 호출 핸들러(handlers)와
 * 네이티브 스크린 요청 핸들러(screenHandlers)를 통합하여 처리합니다.
 */
export const useMessageHandler = ({
  sendResponse,
  sendErrorResponse,
  screenController,
}: UseMessageHandlerProps) => {
  // 함수 호출 핸들러 초기화
  const handlers = createHandlers();

  // 스크린 핸들러 초기화
  const screenHandlers = createScreenHandlers(screenController);

  // 메시지 처리 함수
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        // 메시지 파싱
        const message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
        const { type, id, payload } = message;

        // 먼저 스크린 핸들러 확인
        const screenHandler = screenHandlers[type as ScreenMessageType];
        if (screenHandler) {
          // 스크린 핸들러가 있으면 실행하고 종료
          screenHandler(id, payload);
          return;
        }

        // 일반 네이티브 함수 호출 처리
        const processMessage = async () => {
          try {
            const handler = handlers[type];
            if (!handler) {
              return {
                id,
                success: false,
                error: `지원하지 않는 메시지 타입입니다. type: ${type}`,
              };
            }

            // 타입 안전성을 위한 캐스팅
            return await (handler as any)(id, payload);
          } catch (error) {
            console.error("Bridge handler error:", error);
            return {
              id,
              success: false,
              error: "메시지 처리 중 오류가 발생했습니다.",
            };
          }
        };

        processMessage()
          .then((response) => {
            if (response.success) {
              sendResponse(response.id, response.data);
            } else {
              sendErrorResponse(
                response.id,
                response.error || "알 수 없는 오류가 발생했습니다.",
              );
            }
          })
          .catch((error) => {
            console.error("Message handler error:", error);
            sendErrorResponse(
              message.id,
              error instanceof Error
                ? error.message
                : "메시지 처리 중 오류가 발생했습니다.",
            );
          });
      } catch (error) {
        console.error("Message parsing error:", error);
        sendErrorResponse("error", "메시지 파싱 중 오류가 발생했습니다.");
      }
    },
    [handlers, screenHandlers, sendResponse, sendErrorResponse],
  );

  return { handleMessage };
};
