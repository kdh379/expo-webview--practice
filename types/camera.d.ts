/**
 * 카메라 관련 타입 정의
 */

// 카메라 타입
type CameraType = "back" | "front";

// 플래시 모드
type FlashMode = "off" | "on" | "auto";

// 카메라 화질
type CameraQuality = "2160p" | "1080p" | "720p" | "480p" | "4:3";

// 사진 촬영 옵션
interface CameraPictureOptions {
  quality?: CameraQuality;
  flash?: FlashMode;
  facing?: CameraType;
  base64?: boolean;
  exif?: boolean;
  skipProcessing?: boolean;
  imageType?: "png" | "jpg";
}

// 비디오 녹화 옵션
interface CameraRecordOptions {
  maxDuration?: number;
  maxFileSize?: number;
  quality?: CameraQuality;
  mute?: boolean;
  mirror?: boolean;
  flash?: FlashMode;
  facing?: CameraType;
}

// 카메라 결과
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
