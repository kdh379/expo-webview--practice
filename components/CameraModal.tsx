import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";

import BaseModal from "./BaseModal";

import type {
  CameraCapturedPicture,
  CameraPictureOptions,
  CameraType,
  FlashMode,
} from "expo-camera";
import type { ReactNode } from "react";
import type { GestureResponderEvent } from "react-native";

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (camera: CameraResult) => void;
  showIdCardGuide?: boolean;
  children?: ReactNode;
  cameraOptions?: Partial<CameraPictureOptions>;
}

const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onCapture,
  children,
  cameraOptions,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const cameraRef = useRef<any>(null);
  const [focusPosition, setFocusPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const focusAnimatedValue = useRef(new Animated.Value(1)).current;

  // 카메라 권한 요청
  useEffect(() => {
    if (visible && permission && !permission.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  // 초점 애니메이션 효과
  useEffect(() => {
    if (focusPosition) {
      // 초점 표시기 애니메이션 시작
      focusAnimatedValue.setValue(1);
      Animated.timing(focusAnimatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // 애니메이션 완료 후 초점 표시기 숨기기
        setFocusPosition(null);
      });
    }
  }, [focusPosition, focusAnimatedValue]);

  // 카메라 방향 전환
  const toggleCameraType = () => {
    setType((current) => (current === "back" ? "front" : "back"));
  };

  // 플래시 모드 전환
  const toggleFlash = () => {
    setFlash((current) => {
      if (current === "off") return "on";
      if (current === "on") return "auto";
      return "off";
    });
  };

  // 화면 터치 시 초점 맞추기
  const handleFocus = async (event: GestureResponderEvent) => {
    if (cameraRef.current && type === "back") {
      try {
        const { locationX, locationY } = event.nativeEvent;

        // 초점 위치 설정 (UI 표시용)
        setFocusPosition({ x: locationX, y: locationY });

        // 카메라 초점 맞추기
        await cameraRef.current.focus({
          x: locationX,
          y: locationY,
        });
      } catch (error) {
        console.error("초점 설정 오류:", error);
      }
    }
  };

  // 사진 촬영
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const defaultOptions: CameraPictureOptions = {
          base64: true,
          quality: 0.7,
          exif: true,
        };

        // 사용자 정의 옵션과 기본 옵션 병합
        const options: CameraPictureOptions = {
          ...defaultOptions,
          ...cameraOptions,
        };

        const photo: CameraCapturedPicture =
          await cameraRef.current.takePictureAsync(options);

        onCapture({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          base64: `data:image/jpeg;base64,${photo.base64}`,
          exif: photo.exif,
        });
        // onClose(); // 사진 촬영 후 모달 닫기
      } catch (error) {
        console.error("사진 촬영 오류:", error);
      }
    }
  };

  // 권한이 없는 경우의 컨텐츠
  const renderNoPermissionContent = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.text}>카메라 접근 권한이 없습니다.</Text>
      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>권한 요청</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>닫기</Text>
      </TouchableOpacity>
    </View>
  );

  // 초점 표시기 렌더링
  const renderFocusIndicator = () => {
    if (!focusPosition) return null;

    return (
      <Animated.View
        style={[
          styles.focusIndicator,
          {
            left: focusPosition.x - 25,
            top: focusPosition.y - 25,
            opacity: focusAnimatedValue,
            transform: [
              {
                scale: focusAnimatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  // 카메라 컨텐츠
  const renderCameraContent = () => (
    <View style={styles.cameraContainer}>
      {permission?.granted ? (
        <>
          <TouchableWithoutFeedback onPress={handleFocus}>
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing={type}
                flash={flash}
                ref={cameraRef}
              >
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                    <MaterialIcons name="close" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={toggleFlash}
                  >
                    <MaterialIcons
                      name={
                        flash === "off"
                          ? "flash-off"
                          : flash === "on"
                            ? "flash-on"
                            : "flash-auto"
                      }
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                {renderFocusIndicator()}
                {children}
              </CameraView>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
              <View style={styles.cameraButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraType}
            >
              <MaterialIcons
                name="flip-camera-android"
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.text}>카메라를 불러오는 중...</Text>
        </View>
      )}
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="카메라"
      hideHeader={permission?.granted}
    >
      {permission && !permission.granted
        ? renderNoPermissionContent()
        : renderCameraContent()}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  bottomBar: {
    height: 100,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  flipButton: {
    position: "absolute",
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  focusIndicator: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
});

export default CameraModal;
