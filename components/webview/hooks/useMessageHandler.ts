import { useCallback } from 'react';
import { WebViewMessageEvent } from 'react-native-webview';
import { NavigationProp } from '@react-navigation/native';
import type { BridgePayload, BluetoothStatus } from '../types/bridge';
import { createMessageHandler } from '../lib/createMessageHandler';
import { createHandlers } from '../handlers';

type UseMessageHandlerProps = {
  navigation: NavigationProp<any>;
  sendResponse: (response: any) => void;
};

export const useMessageHandler = ({
  navigation,
  sendResponse,
}: UseMessageHandlerProps) => {
  const handlers = createHandlers({ navigation });
  const messageHandler = createMessageHandler({
    handlers,
    onError: (error) => {
      console.error('Bridge handler error:', error);
      sendResponse({
        id: 'error',
        success: false,
        error: '메시지 처리 중 오류가 발생했습니다.',
      });
    },
  });

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as BridgePayload;
        const response = await messageHandler(message.type, message.id, message.payload);
        sendResponse(response);
      } catch (error) {
        console.error('Message parsing error:', error);
        sendResponse({
          id: 'error',
          success: false,
          error: '메시지 파싱 중 오류가 발생했습니다.',
        });
      }
    },
    [messageHandler, sendResponse]
  );

  return { handleMessage };
}; 