// Bridge Request Message Types
type BridgeMessage = {
  id: string;
  type: BridgeType;
  payload: any;
};

// Bridge Response Types
type BridgeResponse<T = any> = {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
};

// Bridge Callback Types
type BridgeCallbackFn<T = unknown> = (response: BridgeResponse<T>) => void;
type BridgeCleanupFn = () => void;

// 브릿지 타입 정의 - API paths와 유사한 구조
type bridges = {
  // Dialog
  ALERT: {
    payload: AlertPayload;
    response: AlertResponse;
  };

  // Navigation
  NAVIGATE: {
    payload: {
      screen: string;
      params?: Record<string, unknown>;
    };
    response: void;
  };

  // User ( 테스트용 )
  GET_USER_INFO: {
    payload: undefined;
    response: UserInfoResponse;
  };
  SET_USER_INFO: {
    payload: UserInfoResponse;
    response: void;
  };

  // Bluetooth
  BLUETOOTH_STATUS: {
    payload: undefined;
    response: { status: BluetoothStatus };
  };
  BLUETOOTH_ENABLE_REQUEST: {
    payload: undefined;
    response: undefined;
  };
  BLUETOOTH_SCAN_START: {
    payload: undefined;
    response: {
      devices: BluetoothDevice[];
    };
  };
  BLUETOOTH_SCAN_STOP: {
    payload: undefined;
    response: void;
  };
  BLUETOOTH_CONNECT: {
    payload: {
      deviceId: string;
    };
    response: {
      deviceId: string;
      isConnected: boolean;
    };
  };
  BLUETOOTH_DISCONNECT: {
    payload: {
      deviceId: string;
    };
    response: {
      deviceId: string;
      isConnected: boolean;
    };
  };
  BLUETOOTH_GET_CONNECTED_DEVICES: {
    payload: undefined;
    response: {
      devices: BluetoothDevice[];
    };
  };
  REGISTER_BLUETOOTH_CALLBACK: {
    payload: {
      callbackId: string;
    };
    response: void;
  };
  UNREGISTER_BLUETOOTH_CALLBACK: {
    payload: {
      callbackId: string;
    };
    response: void;
  };

  // Camera
  CAMERA_SHOW: {
    payload: CameraPictureOptions;
    response: CameraResult;
  };
  CAMERA_HIDE: {
    payload: undefined;
    response: void;
  };
  CAMERA_REQUEST_PERMISSION: {
    payload: undefined;
    response: CameraPermissionResponse;
  };
  CAMERA_STOP_RECORDING: {
    payload: undefined;
    response: void;
  };

  // OCR
  OCR_SCAN_ID_CARD: {
    payload: OCRPayload;
    response: OCRResponse;
  };
};

type BridgeType = keyof bridges;
