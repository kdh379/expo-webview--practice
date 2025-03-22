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

  // Camera
  CAMERA_REQUEST_PERMISSION: {
    payload: undefined;
    response: CameraPermissionResponse;
  };
  CAMERA_SHOW: {
    payload: CameraPayload;
    response: CameraResult;
  };

  // OCR
  OCR: {
    payload: OCRPayload;
    response: OCRResponse;
  };

  // 새로운 기능을 여기에 추가
};

type BridgeType = keyof bridges;
