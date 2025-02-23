export type BridgeEventType = 
  | 'ALERT'
  | 'CONFIRM'
  | 'TOAST'
  | 'NAVIGATE'
  | 'GET_USER_INFO'
  | 'SET_USER_INFO'
  | 'BLUETOOTH_STATUS_CHECK'
  | 'BLUETOOTH_ENABLE_REQUEST'
  | 'BLUETOOTH_STATUS'
  | 'REGISTER_BLUETOOTH_CALLBACK'
  | 'UNREGISTER_BLUETOOTH_CALLBACK';

export type BridgePayload<T = unknown> = {
  id: string;
  type: BridgeEventType;
  payload: T;
};

export type BridgeResponse<T = unknown> = {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
};

export type AlertPayload = {
  title?: string;
  message: string;
};

export type ConfirmPayload = {
  title?: string;
  message: string;
};

export type ToastPayload = {
  message: string;
  duration?: number;
};

export type NavigatePayload = {
  screen: string;
  params?: Record<string, unknown>;
};

export type UserInfo = {
  id: string;
  name: string;
  email: string;
};

export type BluetoothStatus = 'on' | 'off' | 'unauthorized' | 'unsupported';

export type BluetoothStatusPayload = {
  status: BluetoothStatus;
  message?: string;
};

export type BluetoothCallbackPayload = {
  callbackId: string;
};

export type BluetoothStatusUpdatePayload = BluetoothStatusPayload & {
  callbackId: string;
}; 