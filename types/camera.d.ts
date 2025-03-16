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
  /**
   * Captured image width.
   */
  width: number;
  /**
   * Captured image height.
   */
  height: number;
  /**
   * On web, the value of `uri` is the same as `base64` because file system URLs are not supported in the browser.
   */
  uri: string;
  /**
   * A Base64 representation of the image.
   */
  base64?: string;
  /**
   * On Android and iOS this object may include various fields based on the device and operating system.
   * On web, it is a partial representation of the [`MediaTrackSettings`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings) dictionary.
   */
  exif?: Partial<MediaTrackSettings> | any;
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
