import type { MessageType, MessageTypes, BridgeResponse } from '../types/bridge';

export type HandlerFunction<T extends MessageType> = (
  id: string,
  payload: MessageTypes[T]
) => Promise<BridgeResponse> | BridgeResponse;

export type MessageHandlers = {
  [T in MessageType]: HandlerFunction<T>;
};

export type CreateMessageHandlerOptions = {
  handlers: Partial<MessageHandlers>;
  onError?: (error: unknown) => void;
};

export const createMessageHandler = ({
  handlers,
  onError = console.error,
}: CreateMessageHandlerOptions) => {
  const handleMessage = async <T extends MessageType>(
    type: T,
    id: string,
    payload: MessageTypes[T]
  ): Promise<BridgeResponse> => {
    try {
      const handler = handlers[type];
      if (!handler) {
        return {
          id,
          success: false,
          error: '지원하지 않는 메시지 타입입니다.',
        };
      }

      return await handler(id, payload);
    } catch (error) {
      onError(error);
      return {
        id,
        success: false,
        error: '메시지 처리 중 오류가 발생했습니다.',
      };
    }
  };

  return handleMessage;
}; 