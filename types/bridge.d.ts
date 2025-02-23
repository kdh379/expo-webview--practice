declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage: (message: string) => void;
    };
    BluetoothBridge?: {
      onStatusChange: (status: BluetoothStatus, message?: string) => void;
    };
  }
} 