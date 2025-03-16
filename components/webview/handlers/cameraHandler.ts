/**
 * 카메라 관련 네이티브 함수 핸들러
 *
 * 카메라 관련 네이티브 기능 중 함수 호출로 처리 가능한 기능을 구현합니다.
 * (스크린이 필요한 기능은 NativeScreenManager에서 처리)
 */

import * as ImagePicker from "expo-image-picker";

import type { MessageHandlers } from "../hooks/useMessageHandler";

/**
 * 카메라 관련 핸들러 생성 함수
 *
 * @returns 카메라 관련 메시지 핸들러
 */
const createCameraHandlers = (): Pick<
  MessageHandlers,
  "CAMERA_REQUEST_PERMISSION"
> => ({
  /**
   * 카메라 권한 요청 핸들러
   */
  CAMERA_REQUEST_PERMISSION: async (id) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      const microphonePermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      return {
        id,
        success: true,
        data: {
          camera: permission,
          microphone: microphonePermission,
        },
      };
    } catch (error) {
      console.error("카메라 권한 요청 오류:", error);
      return {
        id,
        success: false,
        error: "카메라 권한 요청 중 오류가 발생했습니다.",
      };
    }
  },

  // /**
  //  * 이미지를 갤러리에 저장하는 핸들러
  //  */
  // CAMERA_SAVE_TO_LIBRARY: async (id, payload) => {
  //   try {
  //     if (!payload || !payload.uri) {
  //       throw new Error("이미지 URI가 제공되지 않았습니다.");
  //     }

  //     // 미디어 라이브러리 권한 확인 및 요청
  //     const permission = await MediaLibrary.requestPermissionsAsync();

  //     if (!permission.granted) {
  //       return {
  //         id,
  //         success: false,
  //         error: "미디어 라이브러리 접근 권한이 없습니다.",
  //       };
  //     }

  //     // 이미지 저장
  //     const asset = await MediaLibrary.createAssetAsync(payload.uri);

  //     // 앨범에 추가
  //     if (Platform.OS === "ios") {
  //       await MediaLibrary.addAssetsToAlbumAsync([asset], "Camera Roll", false);
  //     }

  //     return {
  //       id,
  //       success: true,
  //       data: {
  //         assetId: asset.id,
  //         uri: asset.uri,
  //       },
  //     };
  //   } catch (error) {
  //     console.error("이미지 저장 오류:", error);
  //     return {
  //       id,
  //       success: false,
  //       error:
  //         error instanceof Error
  //           ? error.message
  //           : "이미지 저장 중 오류가 발생했습니다.",
  //     };
  //   }
  // },
});

export default createCameraHandlers;
