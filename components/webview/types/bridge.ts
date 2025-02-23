export type BluetoothStatus = 'on' | 'off' | 'unauthorized' | 'unavailable';

export type DialogPayload = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export type NavigationPayload = {
  screen: string;
  params?: Record<string, unknown>;
};

export type UserInfoPayload = {
  userId: string;
  name: string;
  email: string;
  // ... 기타 사용자 정보
};

export type BluetoothCallbackPayload = {
  callbackId: string;
};

export type MessageTypes = {
  ALERT: DialogPayload;
  CONFIRM: DialogPayload;
  TOAST: { message: string };
  NAVIGATE: NavigationPayload;
  GET_USER_INFO: undefined;
  SET_USER_INFO: UserInfoPayload;
  BLUETOOTH_STATUS_CHECK: undefined;
  BLUETOOTH_ENABLE_REQUEST: undefined;
  REGISTER_BLUETOOTH_CALLBACK: BluetoothCallbackPayload;
  UNREGISTER_BLUETOOTH_CALLBACK: BluetoothCallbackPayload;
  BLUETOOTH_STATUS: { status: BluetoothStatus; message?: string };
};

export type MessageType = keyof MessageTypes;

export type BridgePayload<T extends MessageType = MessageType> = {
  id: string;
  type: T;
  payload: MessageTypes[T];
};

export type BridgeResponse<T = unknown> = {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}; 