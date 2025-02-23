import type { BridgeEventType, BridgePayload, BridgeResponse, UserInfo, BluetoothStatus, BluetoothStatusPayload } from '../types/bridge';

const generateId = () => Math.random().toString(36).substring(2, 15);

type BridgeCallback = (response: BridgeResponse<unknown>) => void;
const callbacks = new Map<string, BridgeCallback>();

export const initBridge = () => {
  window.addEventListener('message', (event) => {
    try {
      const response = JSON.parse(event.data) as BridgeResponse;
      const callback = callbacks.get(response.id);
      if (callback) {
        callback(response);
        callbacks.delete(response.id);
      }
    } catch (error) {
      console.error('Bridge parse error:', error);
    }
  });
};

export const sendBridgeMessage = <T = unknown, R = unknown>(
  type: BridgeEventType,
  payload: T
): Promise<R> => {
  return new Promise((resolve, reject) => {
    const id = generateId();
    const message: BridgePayload<T> = {
      id,
      type,
      payload,
    };

    callbacks.set(id, (response: BridgeResponse) => {
      if (response.success) {
        resolve(response.data as R);
      } else {
        reject(new Error(response.error));
      }
    });

    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  });
};

// 편의성을 위한 유틸리티 함수들
export const bridge = {
  alert: (title: string, message: string) =>
    sendBridgeMessage('ALERT', { title, message }),

  confirm: (title: string, message: string) =>
    sendBridgeMessage<{ title: string; message: string }, boolean>('CONFIRM', {
      title,
      message,
    }),

  toast: (message: string, duration?: number) =>
    sendBridgeMessage('TOAST', { message, duration }),

  navigate: (screen: string, params?: Record<string, unknown>) =>
    sendBridgeMessage('NAVIGATE', { screen, params }),

  getUserInfo: () => sendBridgeMessage<void, UserInfo>('GET_USER_INFO', undefined),

  setUserInfo: (userInfo: UserInfo) =>
    sendBridgeMessage('SET_USER_INFO', userInfo),

  bluetooth: {
    checkStatus: () => 
      sendBridgeMessage<void, BluetoothStatus>('BLUETOOTH_STATUS_CHECK', undefined),

    requestEnable: () =>
      sendBridgeMessage<void, BluetoothStatusPayload>('BLUETOOTH_ENABLE_REQUEST', undefined),

    onStatusChange: (callback: (status: BluetoothStatus, message?: string) => void) => {
      window.BluetoothBridge = {
        onStatusChange: callback,
      };
    },
  },
} as const; 