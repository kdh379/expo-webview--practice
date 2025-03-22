type FlashMode = "off" | "on" | "auto";

interface CameraPayload {
  physicalDevices?: (
    | "ultra-wide-angle-camera"
    | "wide-angle-camera"
    | "telephoto-camera"
  )[];
  flash?: FlashMode;
}

interface CameraResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
}

// 카메라 권한 응답
interface CameraPermissionResponse {
  camera: {
    status: "granted" | "denied" | "undetermined";
    granted: boolean;
    expires: "never" | number;
  };
  microphone: {
    status: "granted" | "denied" | "undetermined";
    granted: boolean;
    expires: "never" | number;
  };
}
